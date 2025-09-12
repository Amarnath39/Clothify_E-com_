import { getPhonePeClient } from "@/lib/phonepeClient";
import { NextResponse } from "next/server";
import Order from "../../../../../../model/Order";
import { connectDB } from "../../../../../../db";

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

    console.log(response)
    console.log("test")

    // Extract required details from PhonePe response
    const phonePeStatus = response?.status || "PENDING"; // PhonePe sends SUCCESS / FAILED / PENDING
    const transactionId = response?.transactionId || orderId; // fallback to tempTransactionId

    // 🔹 Map PhonePe status → our paymentStatus
    let paymentStatus = "Pending";
    let currentStatus = "PENDING";

    if (phonePeStatus === "SUCCESS") {
      paymentStatus = "SUCCESS";
      currentStatus = "CONFIRMED";
    } else if (phonePeStatus === "FAILED") {
      paymentStatus = "Failed";
      currentStatus = "FAILED";
    } else if (phonePeStatus === "PENDING") {
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
    );

    if (!updatedOrder) {
      return NextResponse.json(
        { error: "Order not found in database" },
        { status: 404 }
      );
    }

    // 🔹 Response to frontend (always return unified status)
    return NextResponse.json({
      success: true,
      status: phonePeStatus, // raw status from PhonePe
      paymentStatus,         // mapped status in our DB
      transactionId,
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error("Payment status check error:", error);
    return NextResponse.json(
      { error: "Status check failed", details: error.message },
      { status: 500 }
    );
  }
}
