// app/api/payment-razorpay/route.ts
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import Order from "../../../model/Order";
import { connectDB } from "../../../../db";



export async function POST(req: Request) {
  try {
    await connectDB();

    const { amount, orderId } = await req.json();

    // ═══════════════════════════════════════════════════════════════════════
    // 1. VALIDATE INPUT
    // ═══════════════════════════════════════════════════════════════════════
    if (!orderId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, msg: "Invalid order ID or amount" },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 2. FETCH ORDER
    // ═══════════════════════════════════════════════════════════════════════
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, msg: "Order not found" },
        { status: 404 }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 3. VALIDATE AMOUNT MATCHES ORDER
    // ═══════════════════════════════════════════════════════════════════════
    if (Math.round(amount) !== Math.round(order.payablePrice)) {
      console.error("❌ Amount mismatch:", {
        requested: amount,
        orderAmount: order.payablePrice,
        orderId: order.orderId,
      });
      return NextResponse.json(
        { success: false, msg: "Amount mismatch. Please refresh and try again." },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 4. PREVENT DOUBLE INITIATION
    // ═══════════════════════════════════════════════════════════════════════
    if (order.paymentStatus === "INITIATED" && order.razorpayOrderId) {
      console.log("⚠️ Reusing existing Razorpay order:", order.razorpayOrderId);
      
      // Return existing Razorpay order instead of creating new one
      return NextResponse.json({
        success: true,
        id: order.razorpayOrderId,
        amount: Math.round(order.payablePrice * 100),
        currency: "INR",
        message: "Using existing payment session",
      });
    }

    if (order.paymentStatus === "PAYMENT_SUCCESS") {
      return NextResponse.json(
        { success: false, msg: "Payment already completed" },
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // 5. CREATE RAZORPAY ORDER
    // ═══════════════════════════════════════════════════════════════════════
    console.log("💳 Creating Razorpay order:", {
      amount: amount,
      orderId: order.orderId,
    });

    const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: "INR",
      receipt: order.orderId || `order_${order._id}`,
      notes: {
        db_order_id: order._id.toString(),
        db_order_number: order.orderId,
        user_id: order.user?.toString() || "",
        customer_name: order.shippingAddress?.name || "",
        customer_mobile: order.shippingAddress?.mobile || "",
      },
    });

    console.log("✅ Razorpay order created:", razorpayOrder.id);

    // ═══════════════════════════════════════════════════════════════════════
    // 6. UPDATE ORDER WITH PAYMENT DETAILS
    // ═══════════════════════════════════════════════════════════════════════
    order.razorpayOrderId = razorpayOrder.id;
    order.paymentStatus = "INITIATED";
    order.paymentMethod = "RAZORPAY";
    
    // Update paymentDetails
    if (!order.paymentDetails) {
      order.paymentDetails = {};
    }
    order.paymentDetails.initiatedAt = new Date();

    // Initialize and log to paymentLogs
    if (!order.paymentLogs) {
      order.paymentLogs = [];
    }
    order.paymentLogs.push({
      status: "INITIATED",
      timestamp: new Date(),
      details: {
        razorpayOrderId: razorpayOrder.id,
        amount: amount,
        currency: "INR",
        receipt: razorpayOrder.receipt,
      },
    });

    await order.save();
    console.log("✅ Order updated with Razorpay details");

    // ═══════════════════════════════════════════════════════════════════════
    // 7. RETURN SUCCESS
    // ═══════════════════════════════════════════════════════════════════════
    return NextResponse.json({
      success: true,
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      receipt: razorpayOrder.receipt,
    });

  } catch (error: any) {
    console.error("💥 Error creating Razorpay order:", error);

    // Try to log error to order
    try {
      const { orderId } = await req.json().catch(() => ({}));
      if (orderId) {
        await Order.findByIdAndUpdate(orderId, {
          $push: {
            paymentLogs: {
              status: "INITIATION_ERROR",
              timestamp: new Date(),
              details: {
                error: error.message,
                type: "RAZORPAY_ORDER_CREATION_FAILED",
              },
            },
          },
        });
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return NextResponse.json(
      {
        success: false,
        msg: "Failed to create payment order",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}