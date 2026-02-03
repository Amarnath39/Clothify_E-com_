// app/api/payment/failed/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../db";
import Order from "../../../../model/Order";

export async function POST(req: NextRequest) {
  try {
    await connectDB(); // ← CRITICAL: You were missing this!

    const body = await req.json();
    const {
      razorpay_order_id,
      db_order_id,
      error_code,
      error_description,
      error_source,
      error_step,
      error_reason,
      metadata,
    } = body;

    console.log("Payment failed webhook:", { razorpay_order_id, db_order_id });

    // Validation
    if (!razorpay_order_id && !db_order_id) {
      return NextResponse.json(
        { success: false, msg: "Either razorpay_order_id or db_order_id is required" },
        { status: 400 }
      );
    }

    let order;

    // First try by razorpay_order_id (most reliable)
    if (razorpay_order_id) {
      order = await Order.findOne({ razorpayOrderId: razorpay_order_id });
    }

    // Fallback to db_order_id
    if (!order && db_order_id) {
      order = await Order.findById(db_order_id);
    }

    if (!order) {
      console.warn("Failed payment for unknown order:", body);
      return NextResponse.json(
        { success: false, msg: "Order not found" },
        { status: 404 }
      );
    }

    const errorMessage = error_description || error_reason || "Payment failed";

    // Main logic: Only mark as failed if not already successful
    if (order.paymentStatus !== "PAYMENT_SUCCESS") {
      await Order.findByIdAndUpdate(
        order._id,
        {
          $set: {
            paymentStatus: "PAYMENT_DECLINED",
            paymentError: errorMessage,
            lastFailedAt: new Date(),
          },
          $push: {
            paymentLogs: {
              status: "PAYMENT_DECLINED",
              timestamp: new Date(),
              razorpayOrderId: razorpay_order_id || order.razorpayOrderId,
              errorCode: error_code,
              errorDescription: error_description,
              errorSource: error_source,
              errorStep: error_step,
              errorReason: error_reason,
              metadata: metadata || {},
            },
          },
        },
        { new: true, upsert: false }
      );

      return NextResponse.json({
        success: true,
        msg: "Payment failure recorded",
        orderId: order._id.toString(),
      });
    }

    // Rare case: Failure event after success (possible due to async webhooks)
    await Order.findByIdAndUpdate(order._id, {
      $push: {
        paymentLogs: {
          status: "IGNORED_FAILURE_AFTER_SUCCESS",
          timestamp: new Date(),
          note: "Payment was already marked successful",
          receivedError: {
            errorCode: error_code,
            errorDescription: error_description,
            razorpayOrderId: razorpay_order_id,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      msg: "Failure ignored — payment already successful",
      orderId: order._id.toString(),
    });

  } catch (error: any) {
    console.error("Error in /api/payment/failed:", error);
    return NextResponse.json(
      {
        success: false,
        msg: "payment failure processing error",
        // Only expose error in development
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}