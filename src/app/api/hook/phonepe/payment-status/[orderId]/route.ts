import { NextRequest, NextResponse } from "next/server";
import Order from "@/model/Order";
import { sendUserOrderEmail } from "@/helper/sendUserOrderEmail";
import {
  OrderDetails,
  sendAdminOrderEmail,
} from "@/helper/sendAdminOrderEmail";
import Product from "@/model/Product";
import axios from "axios";
import { getPhonePeClient } from "@/lib/phonepeClient";
import { sendOrderConfirmation } from "@/helper/whatsappNotifier";

export const POST = async (
  req: NextRequest,
  { params }: { params: { orderId: string } }
) => {
  try {
    const { orderId } = params;

    // Adopt the more secure server-to-server status check
    const phonePeResponse = await getPhonePeClient().getOrderStatus(orderId);
    const paymentStatus = phonePeResponse?.state; // e.g., "COMPLETED", "FAILED"

    const order = await Order.findOne({ orderId });

    if (!order) {
      console.log(`No order found with orderId: ${orderId}`);
      return NextResponse.json(
        { success: false, msg: "Order not found" },
        { status: 404 }
      );
    }

    // Process the order based on the secure status
    if (paymentStatus === "COMPLETED") {
      const paymentDetail = phonePeResponse?.paymentDetails?.[0]; // get the first element

      order.paymentStatus = "PAYMENT_SUCCESS";
      order.paymentMethod = paymentDetail?.paymentMode;
      order.transactionId = paymentDetail?.transactionId;
      order.date = new Date();

      // ✅ FIXED: Correct stock update logic - using the working approach
      for (const productDetail of order.productDetails) {
        const totalQuantityToDecrement = productDetail.count + (productDetail.freeCount || 0);

        // Use findByIdAndUpdate to directly update stock and sellCount
        await Product.findByIdAndUpdate(productDetail.product, {
          $inc: {
            sellCount: totalQuantityToDecrement,
            stock: -totalQuantityToDecrement,
          },
        });
      }

      const orderDetails: OrderDetails = {
        orderId: order?.orderId,
        customerName: order?.shippingAddress?.name,
        customerEmail: order?.user?.email,
        totalAmount: order?.payablePrice,
        orderDate: new Date(order?.updatedAt).toLocaleString().split(",")[0],
      };

      await sendUserOrderEmail(order);
      await sendAdminOrderEmail(orderDetails);

      // Add WhatsApp notifications
      try {
        const customerPhone = order.shippingAddress?.mobile || "";
        const customerName = order.shippingAddress?.name || "Customer";
        if (customerPhone) {
          await sendOrderConfirmation(
            customerName,
            customerPhone,
            order.orderId,
            "Your Merchant Name", // Replace with actual merchant name if available
            "DTDC" // Or another delivery partner
          );
        }
      } catch (waErr) {
        console.error("WhatsApp Confirmation Failed:", waErr);
      }

      await order.save();

      return NextResponse.json(
        { success: true, msg: "Order updated successfully", order },
        { status: 200 }
      );
    }

    // If payment was not completed (e.g., FAILED, PENDING)
    order.paymentStatus = paymentStatus || "PAYMENT_PENDING";
    await order.save();

    return NextResponse.json(
      { success: false, msg: `Payment status: ${order.paymentStatus}`, order },
      { status: 200 } // Return 200 as the API call itself was successful
    );
  } catch (error) {
    console.log("Error in hooks/phonepe/payment-status: ", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};