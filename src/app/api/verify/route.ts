// app/api/verify/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import Order from "../../../model/Order";
import { connectDB } from "../../../../db";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, msg: "Missing payment details" },
        { status: 400 }
      );
    }

    // Find order
    console.log("🔍 Verification request for Razorpay Order ID:", razorpay_order_id);
    const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    if (!order) {
      console.error("❌ Order not found for Razorpay Order ID:", razorpay_order_id);
      return NextResponse.json(
        { success: false, msg: "Order not found" },
        { status: 404 }
      );
    }
    console.log("✅ Found DB Order ID:", order._id, "Order Number:", order.orderId);

    // If already verified (idempotent)
    if (order.paymentStatus === "PAYMENT_SUCCESS") {
      console.log("⚠️ Payment already verified for order:", order.orderId);
      return NextResponse.json({
        success: true,
        msg: "Payment already verified",
        orderId: order._id,
        orderNumber: order.orderId,
      });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      console.error("❌ Invalid Razorpay signature for order:", order.orderId);
      await Order.findByIdAndUpdate(order._id, {
        paymentStatus: "PAYMENT_DECLINED",
        paymentError: "Invalid signature",
      });

      return NextResponse.json(
        { success: false, msg: "Payment verification failed" },
        { status: 400 }
      );
    }

    // ONLY mark as success — NOTHING ELSE
    console.log("✅ Signature valid. Updating order to PAYMENT_SUCCESS...");
    await Order.findByIdAndUpdate(
      order._id,
      {
        transactionId: razorpay_payment_id,
        paymentStatus: "PAYMENT_SUCCESS",
        paymentMethod: "RAZORPAY",
        paidAt: new Date(),
        currentStatus: "PENDING", // ⭐ Transition from CHECKOUT to PENDING
      },
      { new: true }
    );
    console.log("✅ Order updated successfully");

    return NextResponse.json({
      success: true,
      msg: "Payment verified successfully",
      orderId: order._id,
      orderNumber: order.orderId,
    });
  } catch (error: any) {
    console.error("Verify endpoint error:", error);
    return NextResponse.json(
      { success: false, msg: "Payment verification failed" },
      { status: 500 }
    );
  }
}