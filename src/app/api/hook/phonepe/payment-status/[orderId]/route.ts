import { NextRequest, NextResponse } from "next/server";
import Order from "../../../../../../model/Order";
import { sendUserOrderEmail } from "../../../../../../helper/sendUserOrderEmail";
import {
  OrderDetails,
  sendAdminOrderEmail,
} from "../../../../../../helper/sendAdminOrderEmail";
import Product from "../../../../../../model/Product";
import axios from "axios";
import { getShiprocketToken } from "./shiprocketToken";
import { connectDB } from "../../../../../../../db"; // <-- FIX: Import database connection
import User from "../../../../../../model/User"; // <-- FIX: Import User model

export const POST = async (
  req: NextRequest,
  { params }: { params: { orderId: string } }
) => {
  try {
    await connectDB(); // <-- FIX: Connect to the database
    const { response } = await req.json();
    const { orderId } = params;

    if (!response) {
      console.log("No response in callback response");
      return NextResponse.json(
        { success: false, msg: "Not response in callback response" },
        { status: 400 }
      );
    }

    const order = await Order.findOne({ orderId });

    if (!order) {
      console.log(`No order found with orderId: ${orderId}`);
      return NextResponse.json(
        { success: false, msg: "Order not found" },
        { status: 404 }
      );
    }

    const decodedResponse = JSON.parse(atob(response) || "{}");

    if (decodedResponse?.code === "PAYMENT_SUCCESS") {
      // Find the order by ID
      order.paymentStatus = decodedResponse?.code || "STATUS_UNAVAILABLE";
      order.paymentMethod = decodedResponse?.data?.paymentInstrument?.type;
      order.transactionId = decodedResponse?.data?.transactionId;
      order.date = new Date();
      order.OrderStatus = "Completed"; // Mark order as completed

      // Increment sell count for each product in the order (Stock Reduction)
      for (const productDetail of order.productDetails) {
        await Product.findByIdAndUpdate(productDetail.product, {
          $inc: {
            sellCount: productDetail.count + productDetail.freeCount,
            stock: -(productDetail.count + productDetail.freeCount),
          },
        });
      }

      // --- START: EMAIL LOGIC FIX ---

      // 1. Fetch the User from the database using the ID on the order
      const user = await User.findById(order.user);

      if (user) {
        // 2. Wrap email sending in a try...catch to prevent a crash
        try {
          // 3. Create orderDetails using the fetched user's email and name
          const orderDetails: OrderDetails = {
            orderId: order.orderId,
            customerName: user.name || order.shippingAddress?.name, // Use user's name
            customerEmail: user.email, // Use user's email
            totalAmount: order.payablePrice,
            orderDate: new Date(order.date).toLocaleString().split(",")[0],
          };

          // 4. Send the emails
          await sendUserOrderEmail(order);
          await sendAdminOrderEmail(orderDetails);

          console.log(`Emails sent successfully for order: ${orderId}`);
        } catch (emailError) {
          console.error(
            `Failed to send emails for order: ${orderId}`,
            emailError
          );
          // Do not stop the whole process, just log the error
        }
      } else {
        console.warn(
          `User ${order.user} not found for order ${orderId}. Emails not sent.`
        );
      }
      // --- END: EMAIL LOGIC FIX ---

      // shiprocket integration
      // ... (your shiprocket code) ...

      await order.save();

      return NextResponse.json(
        { success: true, msg: "Order updated successfully", order },
        { status: 200 }
      );
    }

    // --- Handle Failed Payment ---
    order.paymentStatus = decodedResponse?.code || "STATUS_UNAVAILABLE";
    await order.save();

    return NextResponse.json(
      { success: false, msg: "Payment Pending", order },
      { status: 500 }
    );
  } catch (error) {
    console.log("Error in hooks/phonepe/payment-status: ", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};