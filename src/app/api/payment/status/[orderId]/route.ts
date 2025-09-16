import { getPhonePeClient } from "@/lib/phonepeClient";
import { NextResponse } from "next/server";
import Order from "../../../../../../model/Order";
import User from "../../../../../../model/User";  
import { connectDB } from "../../../../../../db";

// 📧 Import email sender
import { sendUserOrderEmail } from "../../../../../../helper/sendUserOrderEmail";
import mongoose from "mongoose";  // ✅ for ObjectId validation

// ✅ Explicit User type
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

    const { orderId } = params; // tempTransactionId from frontend
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // ✅ Get userId from headers
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "x-user-id header is required" }, { status: 400 });
    }

    // ✅ Ensure it's a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid userId format" }, { status: 400 });
    }

    // ✅ Find user by _id (with typing)
    const user = await User.findOne({ _id: userId }).lean<UserType>();
    if (!user || !user.email) {
      return NextResponse.json({ error: "User not found or missing email" }, { status: 404 });
    }

    // 🔹 Call PhonePe API
    // 🔹 Call PhonePe API with x-user-id header
const response: any = await getPhonePeClient().getOrderStatus(orderId, {
  headers: {
    "x-user-id": user._id.toString(), // ✅ Send userId in header
  },
});
    console.log("PhonePe Response:", response);

    // Extract required details from PhonePe response
    const phonePeState = response?.state || "PENDING"; // COMPLETED / FAILED / PENDING
    const transactionId = response?.orderId || orderId; // ✅ use orderId from PhonePe as transactionId

    // 🔹 Map PhonePe state → our paymentStatus
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

    if (!updatedOrder) {
      return NextResponse.json(
        { error: "Order not found in database" },
        { status: 404 }
      );
    }

    // 📧 Send confirmation email if payment success
    let emailResponse: { success: boolean; message: string; error?: any } | null = null;

    if (paymentStatus === "PAYMENT_SUCCESS") {
      emailResponse = await sendUserOrderEmail({
        ...updatedOrder.toObject(),
        orderId: updatedOrder.orderId || updatedOrder._id.toString(),
        customerEmail: user.email, // ✅ no red mark now
      });
    }

    // 🔹 Response to frontend
    return NextResponse.json({
      success: true,
      status: phonePeState,   // raw state from PhonePe
      paymentStatus,          // mapped status
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
