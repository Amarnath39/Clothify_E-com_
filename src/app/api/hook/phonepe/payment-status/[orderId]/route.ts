import { NextRequest, NextResponse } from "next/server";
import Order from "../../../../../../model/Order";
import { sendUserOrderEmail } from "../../../../../../helper/sendUserOrderEmail";
import {
  OrderDetails,
  sendAdminOrderEmail,
} from "../../../../../../helper/sendAdminOrderEmail";
import Product from "../../../../../../model/Product";
import User from "../../../../../../model/User"; // Import User model
import { connectDB } from "../../../../../../../db"; // Import connectDB
// Import axios or other helpers if needed for Shiprocket
// import axios from "axios";
// import { getShiprocketToken } from "./shiprocketToken";

export const POST = async (
  req: NextRequest,
  { params }: { params: { orderId: string } }
) => {
  try {
    // --- 1. Connect to Database ---
    await connectDB();
    const { orderId } = params;
    const { response } = await req.json(); // Get the base64 response

    if (!response) {
      console.log("Webhook Error: No response payload received.");
      return NextResponse.json(
        { success: false, msg: "No response payload received." },
        { status: 400 }
      );
    }

    // --- 2. Decode the response from PhonePe ---
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
    // Use findById if orderId is the MongoDB _id from initiate step
    // Use findOne({ orderId: orderId }) if orderId is your custom field like "ORD_123"
    const order = await Order.findOne({ orderId: orderId }); // Adjust if using _id

    if (!order) {
      console.log(`Webhook Error: No order found with orderId: ${orderId}`);
      return NextResponse.json(
        { success: false, msg: "Order not found" },
        { status: 404 }
      );
    }

    // --- 4. Check if payment was successful ---
    if (decodedResponse?.code === "PAYMENT_SUCCESS") {
      
      // --- Prevent processing already completed orders ---
      if (order.paymentStatus === "PAYMENT_SUCCESS") {
         console.log(`Webhook Info: Order ${orderId} already marked as successful.`);
         return NextResponse.json(
           { success: true, msg: "Order already processed." },
           { status: 200 }
         );
      }

      // --- 5. Update Order Status ---
      order.paymentStatus = "PAYMENT_SUCCESS";
      order.paymentMethod = decodedResponse.data?.paymentInstrument?.type;
      order.transactionId = decodedResponse.data?.transactionId; // Final PhonePe transaction ID
      order.date = new Date();
      order.OrderStatus = "Completed"; // Or "Processing" depending on your flow
      order.currentStatus = "Processing"; // Update current status too

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
            console.warn(`Webhook Warn: Product ${productDetail.product} not found during stock update for order ${orderId}`);
          }
        }
        console.log(`Stock updated for order: ${orderId}`);
      } catch (stockError) {
         console.error(`Webhook Error: Failed to update stock for order ${orderId}`, stockError);
         // Decide if you should stop or continue despite stock error
      }


      // --- 7. Send Emails ---
      const user = await User.findById(order.user);
      if (user) {
        try {
          const orderDetails: OrderDetails = {
            orderId: order.orderId,
            customerName: user.name || order.shippingAddress?.name,
            customerEmail: user.email,
            totalAmount: order.payablePrice,
            orderDate: new Date(order.date).toLocaleString().split(",")[0],
          };
          await sendUserOrderEmail(order); // Pass the full order object
          await sendAdminOrderEmail(orderDetails);
          console.log(`Emails sent successfully for order: ${orderId}`);
        } catch (emailError) {
          console.error(
            `Webhook Error: Failed to send emails for order ${orderId}`,
            emailError
          );
          // Log error but continue
        }
      } else {
        console.warn(
          `Webhook Warn: User ${order.user} not found for order ${orderId}. Emails not sent.`
        );
      }

      // --- 8. (Optional) Shiprocket Integration ---
      // try {
      //   const shiprocketToken = await getShiprocketToken();
      //   if (shiprocketToken) {
      //     // ... Build shiprocketPayload ...
      //     // ... Make axios request ...
      //     // order.shiprocket = shiprocketResponse?.data;
      //   }
      // } catch (shiprocketError) {
      //   console.error(`Webhook Error: Shiprocket integration failed for order ${orderId}`, shiprocketError);
      // }

      // --- 9. Save Final Order ---
      await order.save();
      console.log(`Webhook Success: Order ${orderId} processed successfully.`);

      // --- Respond to PhonePe ---
      return NextResponse.json(
        { success: true, msg: "Order updated successfully" },
        { status: 200 }
      );

    } else {
      // --- 10. Handle Failed or Pending Payment ---
      // Update status if it's not already successful
      if (order.paymentStatus !== "PAYMENT_SUCCESS") {
         order.paymentStatus = decodedResponse?.code || "PAYMENT_FAILED";
         await order.save();
         console.log(`Webhook Info: Order ${orderId} marked as ${order.paymentStatus}.`);
      }
      return NextResponse.json(
        { success: false, msg: `Payment status: ${order.paymentStatus}` },
        { status: 400 } // Use 400 Bad Request for failed payments
      );
    }
  } catch (error) {
    console.error("Webhook Critical Error:", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};