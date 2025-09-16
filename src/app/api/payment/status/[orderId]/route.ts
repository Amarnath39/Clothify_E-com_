import { getPhonePeClient } from "@/lib/phonepeClient";
import { NextResponse } from "next/server";
import Order from "../../../../../../model/Order";
import User from "../../../../../../model/User";
import { connectDB } from "../../../../../../db";
import { sendUserOrderEmail } from "../../../../../../helper/sendUserOrderEmail";
import mongoose from "mongoose";

interface UserType {
  _id: mongoose.Types.ObjectId;
  email: string;
  name?: string;
  phone?: string;
  role?: string;
}

interface Params {
  params: { orderId: string }; // frontend sends tempTransactionId
}

export async function GET(req: Request, { params }: Params) {
  try {
    await connectDB();

    const { orderId } = params;
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // 🔹 Get order first (so we can use the stored user reference)
    const order = await Order.findOne({ tempTransactionId: orderId });
    if (!order) {
      return NextResponse.json({ error: "Order not found in database" }, { status: 404 });
    }

    // 🔹 Use user field from order
    if (!mongoose.Types.ObjectId.isValid(order.user)) {
      return NextResponse.json({ error: "Invalid userId in order" }, { status: 400 });
    }

    const user = await User.findById(order.user).lean<UserType>();
    if (!user || !user.email) {
      return NextResponse.json({ error: "User not found or missing email" }, { status: 404 });
    }

    // 🔹 Call PhonePe API
    const response: any = await getPhonePeClient().getOrderStatus(orderId);
    console.log("PhonePe Response:", response);

    const phonePeState = response?.state || "PENDING"; 
    const transactionId = response?.orderId || orderId; 

    let paymentStatus = "Pending";
    let currentStatus = "PENDING";

    if (phonePeState === "COMPLETED") {
      paymentStatus = "PAYMENT_SUCCESS";
      currentStatus = "CONFIRMED";
    } else if (phonePeState === "FAILED") {
      paymentStatus = "PAYMENT_ERROR";
      currentStatus = "FAILED";
    }

    // 🔹 Update order in DB
    const updatedOrder = await Order.findOneAndUpdate(
      { tempTransactionId: orderId },
      {
        paymentStatus,
        transactionId,
        currentStatus,
      },
      { new: true }
    );

    // 📧 Send confirmation email if payment success
    let emailResponse: { success: boolean; message: string; error?: any } | null = null;

    if (paymentStatus === "PAYMENT_SUCCESS" && updatedOrder) {
      emailResponse = await sendUserOrderEmail({
        ...updatedOrder.toObject(),
        orderId: updatedOrder.orderId || updatedOrder._id.toString(),
        customerEmail: user.email,
      });
    }

    return NextResponse.json({
      success: true,
      status: phonePeState,
      paymentStatus,
      transactionId,
      order: updatedOrder,
      email: emailResponse || { success: false, message: "Email not sent (payment not successful)" },
    });

  } catch (error: any) {
    console.error("Payment status check error:", error);
    return NextResponse.json(
      { error: "Status check failed", details: error.message },
      { status: 500 }
    );
  }
}
