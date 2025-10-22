import { NextRequest, NextResponse } from "next/server";
import Order from "../../../../../../model/Order";
import Product from "../../../../../../model/Product";
import { sendUserOrderEmail } from "../../../../../../helper/sendUserOrderEmail";
import {
  OrderDetails,
  sendAdminOrderEmail,
} from "../../../../../../helper/sendAdminOrderEmail";
import { getPhonePeClient } from "@/lib/phonepeClient";

// The handler now accepts a 'params' object because of the [orderId] in the folder name
export const POST = async (
  req: NextRequest,
  { params }: { params: { orderId: string } }
) => {
  try {
    // ===================================================================
    // 🔒 STEP 1: VALIDATE THE WEBHOOK
    // ===================================================================
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    const checksum = req.headers.get("x-verify") || "";
    const saltKey = process.env.PHONEPE_SALT_KEY as string;
    const saltIndex = process.env.PHONEPE_SALT_INDEX as string;

    // This is the crucial security check.
    const isGenuine = getPhonePeClient().validateCallback(rawBody, checksum, saltKey, saltIndex);

    if (!isGenuine) {
      console.error("Invalid PhonePe webhook signature received.");
      return NextResponse.json(
        { success: false, msg: "Invalid signature" },
        { status: 401 }
      );
    }

    const { response } = body;
    if (!response) {
      console.log("No response field in callback body");
      return NextResponse.json(
        { success: false, msg: "No response field found in callback" },
        { status: 400 }
      );
    }

    const decodedResponse = JSON.parse(atob(response) || "{}");
    
    // ===================================================================
    // ✅ STEP 2: PROCESS THE VALIDATED WEBHOOK
    // ===================================================================
    
    // 👇 THIS IS THE KEY CHANGE: Get orderId from the URL params
    const { orderId } = params;

    const order = await Order.findOne({ orderId });

    if (!order) {
      console.log(`Webhook Error: No order found with orderId: ${orderId}`);
      return NextResponse.json(
        { success: true, msg: "Webhook received but order not found" },
        { status: 200 }
      );
    }
    
    if (order.paymentStatus === "PAYMENT_SUCCESS") {
       return NextResponse.json(
        { success: true, msg: "Order already processed" },
        { status: 200 }
      );
    }

    if (decodedResponse?.code === "PAYMENT_SUCCESS") {
      // Update order details
      order.paymentStatus = "PAYMENT_SUCCESS";
      order.paymentMethod = decodedResponse?.data?.paymentInstrument?.type;
      order.transactionId = decodedResponse?.data?.transactionId;
      order.date = new Date();

      // Atomically update stock for each product
      for (const item of order.productDetails) {
        const totalOrderedCount = (item.count || 0) + (item.freeCount || 0);
        const productId = item.product._id;
        const sizeName = item.size.size;
        
        await Product.updateOne(
          { _id: productId, "sizes.size": sizeName },
          {
            $inc: {
              "sizes.$.stock": -totalOrderedCount,
              "sizes.$.sellCount": totalOrderedCount,
            },
          }
        );
      }

      // Send confirmation emails
      await sendUserOrderEmail(order);
      const adminOrderDetails: OrderDetails = {
        orderId: order?.orderId,
        customerName: order?.shippingAddress?.name,
        customerEmail: order?.user?.email,
        totalAmount: order?.payablePrice,
        orderDate: new Date(order?.updatedAt).toLocaleString().split(",")[0],
      };
      await sendAdminOrderEmail(adminOrderDetails);

      await order.save();
      console.log(`Successfully processed payment for order: ${orderId}`);
      return NextResponse.json({ success: true, msg: "Order processed successfully" });

    } else {
      // Handle failed or pending payments
      order.paymentStatus = decodedResponse?.code || "PAYMENT_FAILED";
      await order.save();
      console.log(`Payment failed or pending for order: ${orderId}. Status: ${order.paymentStatus}`);
      return NextResponse.json({ success: true, msg: "Payment status updated to failed/pending" });
    }

  } catch (error) {
    console.error("Error in PhonePe webhook: ", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};