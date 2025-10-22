import { v4 as uuidv4 } from "uuid";
import { getPhonePeClient } from "@/lib/phonepeClient";
import { CreateSdkOrderRequest } from "pg-sdk-node";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { amount, userId }: { amount: number; userId: string } =
      await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const merchantOrderId = `ORDER_${uuidv4()}`;
    const redirectUrl = `${process.env.MERCHANT_REDIRECT_URL}?orderId=${merchantOrderId}`;
    const callbackUrl = `${process.env.MERCHANT_CALLBACK_URL}/${merchantOrderId}`;

    // 1. Use the builder ONLY for properties it supports
    const baseRequest = CreateSdkOrderRequest.StandardCheckoutBuilder()
      .merchantOrderId(merchantOrderId)
      .amount(amount * 100)
      .redirectUrl(redirectUrl)
      // .merchantUserId(userId) <-- REMOVED FROM HERE
      .build();
      
    // 2. Manually add ALL other required properties
    const finalRequest = {
      ...baseRequest,
      callbackUrl: callbackUrl,
      merchantUserId: userId, // <-- ADDED HERE
    };

    // 3. Call the SDK method with our complete request object
    const response = await getPhonePeClient().createSdkOrder(finalRequest as any);

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