import { v4 as uuidv4 } from "uuid";
import { getPhonePeClient } from "@/lib/phonepeClient";
import { CreateSdkOrderRequest } from "pg-sdk-node";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { amount, userId }: { amount: number; userId: string } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const merchantOrderId = `ORDER_${uuidv4()}`;
    const redirectUrl = `${process.env.MERCHANT_REDIRECT_URL}?orderId=${merchantOrderId}`;

    const request = CreateSdkOrderRequest.StandardCheckoutBuilder()
      .merchantOrderId(merchantOrderId)
      .amount(amount * 100)
      .redirectUrl(redirectUrl)
      .build();

    const response = await getPhonePeClient().createSdkOrder(request);

    return NextResponse.json({
      success: true,
      token: response.token,
      orderId: merchantOrderId,
    });
  } catch (error: any) {
    console.error("SDK order creation error:", error);
    return NextResponse.json(
      { error: "Order creation failed", details: error.message },
      { status: 500 }
    );
  }
}