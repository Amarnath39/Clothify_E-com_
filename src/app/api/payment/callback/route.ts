import { NextResponse } from "next/server";
import { getPhonePeClient } from "@/lib/phonepeClient";

// Imports from your original "hook" file
import Order from "../../../../model/Order";
import { sendUserOrderEmail } from "../../../../helper/sendUserOrderEmail";
import {
  OrderDetails,
  sendAdminOrderEmail,
} from "../../../../helper/sendAdminOrderEmail";
import Product from "../../../../model/Product";
import User from "../../../../model/User";
import { connectDB } from "../../../../../db";

export async function POST(req: Request) {
  let order; // Define order here to access it in the final catch block

  try {
    const authorizationHeader = req.headers.get("authorization") || "";
    
    // 1. Get the raw body text for validation
    // The validation function needs the raw string, not the parsed JSON
    const bodyText = await req.text();

    // 2. Validate the callback
    const isValid = await getPhonePeClient().validateCallback(
      process.env.MERCHANT_USERNAME as string,
      process.env.MERCHANT_PASSWORD as string,
      authorizationHeader,
      bodyText // Use the raw text for validation
    );

    if (!isValid) {
      console.error("Invalid callback received");
      return NextResponse.json({ error: "Invalid callback" }, { status: 401 });
    }

    // 3. Parse the JSON now that it's validated
    const callbackData = JSON.parse(bodyText);

    // --- Logic from your "hook" file begins here ---

    // 4. Get Order ID and payload
    const orderId = callbackData.payload.merchantOrderId as string;
    // 'decodedResponse' from your hook is 'callbackData.payload' here
    const decodedResponse = callbackData.payload; 

    if (!orderId) {
        console.error("Callback Error: merchantOrderId not found in payload.");
        return NextResponse.json({ error: "Invalid payload: missing merchantOrderId" }, { status: 400 });
    }

    await connectDB();

    // 5. Find the Order
    order = await Order.findById(orderId);

    if (!order) {
      console.log(`Callback Error: No order found with _id: ${orderId}`);
      // We return 404, but PhonePe might not understand this.
      // It's mainly for our own logging.
      return NextResponse.json(
        { success: false, msg: "Order not found" },
        { status: 404 }
      );
    }

    // 6. Debugging Step: Log the entire callback
    if (!Array.isArray(order.paymentDebugLogs)) {
      order.paymentDebugLogs = [];
    }
    order.paymentDebugLogs.push({
      timestamp: new Date(),
      response: callbackData, // Log the *entire* validated callback data
    });

    // 7. Check payment status using the callback 'type'
    switch (callbackData.type) {
      case "PAYMENT_SUCCESS":
        console.log("Payment successful for:", orderId);

        // 8. Idempotency Check: Prevent processing already completed orders
        if (order.paymentStatus === "PAYMENT_SUCCESS") {
          console.log(`Callback Info: Order ${orderId} already marked as successful.`);
          await order.save(); // Save the new debug log
          return new Response("OK", { status: 200 }); // Acknowledge success
        }

        // 9. Update Order Status
        order.paymentStatus = "PAYMENT_SUCCESS";
        order.paymentMethod = decodedResponse.data?.paymentInstrument?.type;
        order.transactionId = decodedResponse.data?.transactionId;
        order.date = new Date();
        order.OrderStatus = "Completed";
        order.currentStatus = "Processing";

        // 10. Reduce Stock
        try {
          for (const productDetail of order.productDetails) {
            const result = await Product.findByIdAndUpdate(productDetail.product, {
              $inc: {
                sellCount: productDetail.count + productDetail.freeCount,
                stock: -(productDetail.count + productDetail.freeCount),
              },
            });
            if (!result) {
              console.warn(`Callback Warn: Product ${productDetail.product} not found...`);
            }
          }
          console.log(`Stock updated for order: ${orderId}`);
        } catch (stockError) {
          console.error(`Callback Error: Failed to update stock for order ${orderId}`, stockError);
          order.paymentDebugLogs.push({
            timestamp: new Date(),
            error: "Stock update failed",
            details: (stockError as Error).message,
          });
          // We still continue to save the order
        }

        // 11. Send Emails (Your logic here)
        try {
          // const user = await User.findById(order.user);
          // if (user) {
          //   await sendUserOrderEmail(user.email, order);
          //   const adminOrderDetails: OrderDetails = { ... };
          //   await sendAdminOrderEmail(adminOrderDetails);
          // }
        } catch (emailError) {
            console.error(`Callback Error: Failed to send emails for order ${orderId}`, emailError);
            order.paymentDebugLogs.push({
                timestamp: new Date(),
                error: "Email sending failed",
                details: (emailError as Error).message,
            });
        }


        // 12. Save Final Order
        await order.save();
        console.log(`Callback Success: Order ${orderId} processed successfully.`);

        // 13. Acknowledge the S2S callback
        return new Response("OK", { status: 200 });

      case "PAYMENT_ERROR":
      case "PAYMENT_DECLINED":
      default:
        // 14. Handle Failed or Pending Payment
        console.log(`Payment status for ${orderId}: ${callbackData.type}`);
        
        // Only update status if it wasn't already successful
        if (order.paymentStatus !== "PAYMENT_SUCCESS") {
          order.paymentStatus = callbackData.type || decodedResponse?.state || "PAYMENT_FAILED";
        }
        
        // Save the order with the debug log and the failed status
        await order.save(); 
        console.log(`Callback Info: Order ${orderId} marked as ${order.paymentStatus}.`);
        
        // Acknowledge the S2S callback.
        // We return "OK" because *we successfully received* the "failed" status.
        // Returning an error would make PhonePe try to send it again.
        return new Response("OK", { status: 200 });
    }

  } catch (error: any) {
    console.error("Callback Critical Error:", error);
    
    // 15. Global Error: Try to log to the order if we found it
    if (order) {
      try {
        if (!Array.isArray(order.paymentDebugLogs)) {
            order.paymentDebugLogs = [];
        }
        order.paymentDebugLogs.push({
            timestamp: new Date(),
            error: "Callback Critical Error",
            details: (error as Error).message,
        });
        await order.save();
      } catch (saveError) {
          console.error("Failed to save critical error log to order:", saveError);
      }
    }
    
    // Return a 500 error. PhonePe will see this and likely retry the callback.
    return NextResponse.json(
      { error: "Callback processing failed", details: error.message },
      { status: 500 }
    );
  }
}