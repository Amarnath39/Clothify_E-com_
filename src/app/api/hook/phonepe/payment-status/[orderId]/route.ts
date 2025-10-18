import { NextRequest, NextResponse } from "next/server";
// --- FIX: All relative paths are now absolute path aliases ---
import Order from "@/model/Order";
// --- FIX: Changed 'helper' to 'helpers' to match the likely folder name ---
import { sendUserOrderEmail } from "@/helpers/sendUserOrderEmail";
import {
  OrderDetails,
  sendAdminOrderEmail,
} from "@/helpers/sendAdminOrderEmail";
import Product from "@/model/Product";
import axios from "axios";
import { getPhonePeClient } from "@/lib/phonepeClient";
import { sendOrderConfirmation } from "@/helpers/whatsappNotifier";

export const POST = async (
  req: NextRequest,
  { params }: { params: { orderId: string } }
) => {
  try {
    // We no longer need the client-side 'response' from req.json()
    const { orderId } = params;

    // --- CORRECTION 2: Adopt the more secure server-to-server status check ---
    // Instead of decoding a payload, we ask PhonePe's server for the true status.
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

    // --- CORRECTION 3: Process the order based on the secure status ---
    if (paymentStatus === "COMPLETED") {
      order.paymentStatus = "PAYMENT_SUCCESS";
      order.paymentMethod = phonePeResponse?.paymentInstrument?.type;
      order.transactionId = phonePeResponse?.transactionId;
      order.date = new Date();

      // --- We are KEEPING your superior stock update logic below ---
      for (const productDetail of order.productDetails) {
        const totalQuantityToDecrement =
          productDetail.count + (productDetail.freeCount || 0);

        const updateResult = await Product.findOneAndUpdate(
          {
            _id: productDetail.product,
            "sizes.size": productDetail.size, // Target the specific size
          },
          {
            $inc: {
              sellCount: totalQuantityToDecrement,
              "sizes.$.stock": -totalQuantityToDecrement,
            },
          }
        );

        if (!updateResult) {
          console.error(
            `Failed to update stock for product ${productDetail.product} with size "${productDetail.size}". This usually means the 'size' field is missing from the order details.`
          );
        }
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

      // --- CORRECTION 4: Add WhatsApp notifications ---
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

