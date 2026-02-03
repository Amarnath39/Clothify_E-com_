import { NextRequest, NextResponse } from "next/server";
import User from "../../../model/User";
import Order from "../../../model/Order";
import { connectDB } from "../../../../db";

export const POST = async (req: NextRequest) => {
  try {
    await connectDB();

    const userId = req.headers.get("x-user-id");
    console.log("User ID from headers:", userId);
    if (!userId) {
      return NextResponse.json(
        { success: false, msg: "Missing user ID" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, msg: "Unauthorized user" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { orderId, amount } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, msg: "Order ID required" },
        { status: 400 }
      );
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, msg: "Order not found" },
        { status: 404 }
      );
    }

    // console.log(userId,user,orderId)

    if (order.user.toString() !== userId) {
      return NextResponse.json(
        { success: false, msg: "Unauthorized access to order" },
        { status: 403 }
      );
    }

    // Check order payment status
    if (
      order.paymentStatus === "PAYMENT_SUCCESS"
    ) {
      return NextResponse.json(
        { success: false, msg: "Order already paid" },
        { status: 400 }
      );
    }

    // Verify amount integrity
    const serverAmount = order.payablePrice;
    if (serverAmount !== amount) {
      return NextResponse.json(
        { success: false, msg: "Amount mismatch. Please refresh and try again." },
        { status: 400 }
      );
    }

    console.log("✅ Order verification passed");
    // ✅ All checks passed — verification success
    return NextResponse.json(
      {
        success: true,
        msg: "Order verified successfully",
        redirectUrl: `/payment/home?orderId=${order._id}`,
        orderId: order._id,
        amount: serverAmount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error in /api/order-verify:", error);
    return NextResponse.json(
      { success: false, msg: "Failed to verify order" },
      { status: 500 }
    );
  }
};