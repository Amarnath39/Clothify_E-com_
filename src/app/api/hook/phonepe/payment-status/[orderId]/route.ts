import { NextRequest, NextResponse } from "next/server";
import Order from "@/model/Order";
import { sendUserOrderEmail } from "@/helper/sendUserOrderEmail";
import {
  OrderDetails,
  sendAdminOrderEmail,
} from "@/helper/sendAdminOrderEmail";
import Product from "@/model/Product";
import { getPhonePeClient } from "@/lib/phonepeClient";
import { sendOrderConfirmation } from "@/helper/whatsappNotifier";

export const POST = async (
  req: NextRequest,
  { params }: { params: { orderId: string } }
) => {
  try {
    const { orderId } = params;

    const phonePeResponse = await getPhonePeClient().getOrderStatus(orderId);
    const paymentStatus = phonePeResponse?.state;

    const order = await Order.findOne({ orderId });

    if (!order) {
      console.log(`No order found with orderId: ${orderId}`);
      return NextResponse.json(
        { success: false, msg: "Order not found" },
        { status: 404 }
      );
    }
    
    // --- FIX: Prevent reprocessing a completed order ---
    if (order.paymentStatus === "PAYMENT_SUCCESS") {
      console.log(`Order ${orderId} has already been processed.`);
      return NextResponse.json(
        { success: true, msg: "Order already processed", order },
        { status: 200 }
      );
    }

    if (paymentStatus === "COMPLETED") {
      const paymentDetail = phonePeResponse?.paymentDetails?.[0];

      order.paymentStatus = "PAYMENT_SUCCESS";
      order.paymentMethod = paymentDetail?.paymentMode;
      order.transactionId = paymentDetail?.transactionId;
      order.date = new Date();

      // --- THE CRITICAL FIX: Update stock for the SPECIFIC size purchased ---
      for (const productDetail of order.productDetails) {
        const totalQuantityToDecrement =
          productDetail.count + (productDetail.freeCount || 0);

        // This query now finds the product AND the specific size within it to update.
        const updateResult = await Product.findOneAndUpdate(
          {
            _id: productDetail.product,
            "sizes.size": productDetail.size, // Target the specific size
          },
          {
            $inc: {
              "sizes.$.stock": -totalQuantityToDecrement, // The '$' updates the matched size's stock
              sellCount: totalQuantityToDecrement, // Also increment the total sell count
            },
          },
          { new: true } // Return the updated document
        );

        if (!updateResult) {
          console.error(
            `Failed to update stock for product ${productDetail.product} with size "${productDetail.size}". This usually means the 'size' field is missing from the order details or does not match.`
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

      try {
        const customerPhone = order.shippingAddress?.mobile || "";
        const customerName = order.shippingAddress?.name || "Customer";
        if (customerPhone) {
          await sendOrderConfirmation(
            customerName,
            customerPhone,
            order.orderId,
            "Your Merchant Name",
            "DTDC"
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

    order.paymentStatus = paymentStatus || "PAYMENT_PENDING";
    await order.save();

    return NextResponse.json(
      { success: false, msg: `Payment status: ${order.paymentStatus}`, order },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error in hooks/phonepe/payment-status: ", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};

