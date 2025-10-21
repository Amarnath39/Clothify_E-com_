import { NextRequest, NextResponse } from "next/server";
import Order from "../../../../../../model/Order";
import { sendUserOrderEmail } from "../../../../../../helper/sendUserOrderEmail";
import {
  OrderDetails,
  sendAdminOrderEmail,
} from "../../../../../../helper/sendAdminOrderEmail";
import Product from "../../../../../../model/Product";
import User from "../../../../../../model/User";
import { connectDB } from "../../../../../../../db";

export const POST = async (
  req: NextRequest,
  { params }: { params: { orderId: string } }
) => {
  let order; // Define order here to access it in catch block

  try {
    await connectDB();
    const { orderId } = params; // This is the MongoDB _id
    const { response } = await req.json();

    if (!response) {
      console.log("Webhook Error: No response payload received.");
      return NextResponse.json(
        { success: false, msg: "No response payload received." },
        { status: 400 }
      );
    }

    let decodedResponse;
    try {
      decodedResponse = JSON.parse(atob(response) || "{}");
    } catch (e) {
      console.error("Webhook Error: Failed to decode base64 response", e);
      return NextResponse.json(
        { success: false, msg: "Invalid response format." },
        { status: 400 }
      );
    }

    // --- 3. Find the Order ---
    order = await Order.findById(orderId);

    if (!order) {
      console.log(`Webhook Error: No order found with _id: ${orderId}`);
      return NextResponse.json(
        { success: false, msg: "Order not found" },
        { status: 404 }
      );
    }

    // --- !! DEBUGGING STEP !! ---
    // Initialize the logs array if it doesn't exist
    if (!Array.isArray(order.paymentDebugLogs)) {
      order.paymentDebugLogs = [];
    }
    // Add the *entire* decoded response from PhonePe to the order
    order.paymentDebugLogs.push({
      timestamp: new Date(),
      response: decodedResponse,
    });
    // --- !! END DEBUGGING STEP !! ---

    // --- 4. Check if payment was successful ---
    if (decodedResponse?.code === "PAYMENT_SUCCESS") {
      
      // Prevent processing already completed orders
      if (order.paymentStatus === "PAYMENT_SUCCESS") {
        console.log(`Webhook Info: Order ${orderId} already marked as successful.`);
        await order.save(); // Save the debug log even if already processed
        return NextResponse.json(
          { success: true, msg: "Order already processed." },
          { status: 200 }
        );
      }

      // --- 5. Update Order Status ---
      order.paymentStatus = "PAYMENT_SUCCESS";
      order.paymentMethod = decodedResponse.data?.paymentInstrument?.type;
      order.transactionId = decodedResponse.data?.transactionId;
      order.date = new Date();
      order.OrderStatus = "Completed";
      order.currentStatus = "Processing";

      // --- 6. Reduce Stock ---
      try {
        for (const productDetail of order.productDetails) {
          const result = await Product.findByIdAndUpdate(productDetail.product, {
            $inc: {
              sellCount: productDetail.count + productDetail.freeCount,
              stock: -(productDetail.count + productDetail.freeCount),
            },
          });
          if (!result) {
            console.warn(`Webhook Warn: Product ${productDetail.product} not found...`);
          }
        }
        console.log(`Stock updated for order: ${orderId}`);
      } catch (stockError) {
        console.error(`Webhook Error: Failed to update stock for order ${orderId}`, stockError);
        order.paymentDebugLogs.push({
            timestamp: new Date(),
            error: "Stock update failed",
            details: (stockError as Error).message,
        });
        // Continue...
      }

      // --- 7. Send Emails ---
      // ... (your email logic) ...

      // --- 9. Save Final Order ---
      await order.save();
      console.log(`Webhook Success: Order ${orderId} processed successfully.`);

      return NextResponse.json(
        { success: true, msg: "Order updated successfully" },
        { status: 200 }
      );

    } else {
      // --- 10. Handle Failed or Pending Payment ---
      if (order.paymentStatus !== "PAYMENT_SUCCESS") {
        order.paymentStatus = decodedResponse?.code || "PAYMENT_FAILED";
      }
      
      // Save the order with the debug log and the failed status
      await order.save(); 
      console.log(`Webhook Info: Order ${orderId} marked as ${order.paymentStatus}.`);
      
      return NextResponse.json(
        { success: false, msg: `Payment status: ${order.paymentStatus}` },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Webhook Critical Error:", error);
    
    // If we found the order before the error, log the error
    if (order) {
        order.paymentDebugLogs.push({
            timestamp: new Date(),
            error: "Webhook Critical Error",
            details: (error as Error).message,
        });
        await order.save();
    }
    
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};