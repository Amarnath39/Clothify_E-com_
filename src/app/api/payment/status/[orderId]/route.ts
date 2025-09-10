import { getPhonePeClient } from "@/lib/phonepeClient";
import { NextResponse } from "next/server";

interface Params {
  params: { orderId: string };
}

export async function GET(req: Request, { params }: Params) {
  try {
    const { orderId } = params;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const response = await getPhonePeClient().getOrderStatus(orderId);

    return NextResponse.json({
      success: true,
      status: response.state,
      data: response,
    });
  } catch (error: any) {
    console.error("Payment status check error:", error);
    return NextResponse.json(
      { error: "Status check failed", details: error.message },
      { status: 500 }
    );
  }
}
