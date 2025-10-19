import { getPhonePeClient } from "@/lib/phonepeClient";
import { NextResponse } from "next/server";
// --> ADD: Import your Mongoose models
import Order from "../../../../model/Order"; // Adjust the path as needed
import Product from "../../../../model/Product"; // Adjust the path as needed

export async function POST(req: Request) {
  try {
    const authorizationHeader = req.headers.get("authorization") || "";
    const body = await req.json();
    const responseBody = JSON.stringify(body);

    const isValid = await getPhonePeClient().validateCallback(
      process.env.MERCHANT_USERNAME as string,
      process.env.MERCHANT_PASSWORD as string,
      authorizationHeader,
      responseBody
    );

    if (!isValid) {
      console.error("Invalid callback received");
      return NextResponse.json({ error: "Invalid callback" }, { status: 401 });
    }

    const callbackData = body;
    // Assuming merchantOrderId is the same as your internal orderId
    const orderId = callbackData.payload.merchantOrderId as string;

    switch (callbackData.type) {
      case "PAYMENT_SUCCESS":
        console.log("Payment successful for:", orderId);

        // --> ADDED LOGIC START
        
        // 1. Find the order in your database
        const order = await Order.findOne({ orderId: orderId });

        if (!order) {
          console.error(`Webhook Error: No order found with orderId: ${orderId}`);
          // Return OK to PhonePe, as the issue is on our side.
          return new Response("OK: Order not found", { status: 200 });
        }

        // 2. Idempotency Check: Prevent processing the same order twice
        if (order.paymentStatus === "PAYMENT_SUCCESS") {
          console.log(`Order ${orderId} has already been processed.`);
          return new Response("OK: Already processed", { status: 200 });
        }
        
        // 3. Update order details
        order.paymentStatus = "PAYMENT_SUCCESS";
        order.transactionId = callbackData.payload.providerReferenceId; // or transactionId
        order.paymentMethod = callbackData.payload.paymentInstrument.type;
        order.date = new Date();

        // 4. Update product stock and sell count
        for (const productDetail of order.productDetails) {
          await Product.findByIdAndUpdate(productDetail.product, {
            $inc: {
              sellCount: productDetail.count + productDetail.freeCount,
              stock: -(productDetail.count + productDetail.freeCount),
            },
          });
        }
        
        // 5. Save the updated order
        await order.save();
        
        // trigger emails here as well
        // await sendUserOrderEmail(order);
        // await sendAdminOrderEmail(orderDetails);

        // --> ADDED LOGIC END
        
        break;

      case "PAYMENT_ERROR":
        console.log("Payment failed for:", orderId);
        // You can also update the order status to FAILED here
        await Order.findOneAndUpdate(
            { orderId: orderId },
            { paymentStatus: "PAYMENT_ERROR" }
        );
        break;

      default:
        console.log("Unknown callback type:", callbackData.type);
    }

    // Acknowledge receipt to PhonePe
    return new Response("OK", { status: 200 });

  } catch (error: any) {
    console.error("Callback handling error:", error);
    return NextResponse.json(
      { error: "Callback processing failed", details: error.message },
      { status: 500 }
    );
  }
}