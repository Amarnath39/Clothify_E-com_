import { getPhonePeClient } from "@/lib/phonepeClient";
import { NextResponse } from "next/server";
import Order from "../../../../../../model/Order";
import { connectDB } from "../../../../../../db";

// 📧 Import email sender
import { sendUserOrderEmail } from "../../../../../../helper/sendUserOrderEmail"; 

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

    // 🔹 Call PhonePe API
    const response: any = await getPhonePeClient().getOrderStatus(orderId);

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
    } else if (phonePeState === "PENDING") {
      paymentStatus = "Pending";
      currentStatus = "PENDING";
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
    ).populate("user", "email name"); // ✅ populate user email & name if needed

    if (!updatedOrder) {
      return NextResponse.json(
        { error: "Order not found in database" },
        { status: 404 }
      );
    }

    // 📧 Try sending confirmation email if payment is successful
   // 📧 Try sending confirmation email if payment is successful
let emailResponse: { success: boolean; message: string; error?: any } | null = null;

if (paymentStatus === "PAYMENT_SUCCESS" && updatedOrder.orderId) {
  emailResponse = await sendUserOrderEmail({
    ...updatedOrder.toObject(),
    orderId: updatedOrder.orderId, // ✅ ensure orderId is included
  });
}


    // 🔹 Response to frontend (include email status if attempted)
    return NextResponse.json({
      success: true,
      status: phonePeState,   // raw state from PhonePe
      paymentStatus,          // mapped status in our DB
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
