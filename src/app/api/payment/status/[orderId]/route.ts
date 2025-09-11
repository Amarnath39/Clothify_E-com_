import { getPhonePeClient } from "@/lib/phonepeClient";
import { NextResponse } from "next/server";
import Order from "../../../../../../model/Order";
import { connectDB } from "../../../../../../db";

interface Params {
  params: { orderId: string }; 
}

export async function GET(req: Request, { params }: Params) {
  try {
    await connectDB();

    const { orderId } = params; 

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    
    const response = await getPhonePeClient().getOrderStatus(orderId);

    // Extract required details
    const paymentStatus = response?.status || "PENDING"; // ✅ use `status`
    const transactionId =
      response?.transactionId || orderId; // ✅ fallback to tempTransactionId if null

    // 🔹 Find order by tempTransactionId and update
    const updatedOrder = await Order.findOneAndUpdate(
      { tempTransactionId: orderId },
      {
        paymentStatus,
        transactionId,
      },
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json(
        { error: "Order not found in database" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      status: paymentStatus,
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
