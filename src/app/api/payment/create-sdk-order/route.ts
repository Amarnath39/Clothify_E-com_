import { v4 as uuidv4 } from "uuid";
import { getPhonePeClient } from "@/lib/phonepeClient";
import { CreateSdkOrderRequest } from "pg-sdk-node";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // This part is now correct
    const { amount, userId }: { amount: number; userId: string } =
      await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const merchantOrderId = `ORDER_${uuidv4()}`;
    const redirectUrl = `${process.env.MERCHANT_REDIRECT_URL}?orderId=${merchantOrderId}`;
    const callbackUrl = process.env.MERCHANT_CALLBACK_URL;

    const baseRequest = CreateSdkOrderRequest.StandardCheckoutBuilder()
      .merchantOrderId(merchantOrderId)
      .amount(amount * 100)
      .redirectUrl(redirectUrl)
      .build();
      
    const finalRequest = {
      ...baseRequest,
      callbackUrl: callbackUrl,
      merchantUserId: userId,
    };

    // This 'response' object contains the redirectUrl from PhonePe
const response: any = await getPhonePeClient().createSdkOrder(finalRequest as any);
    // 👇 CORRECTED RETURN STATEMENT
    // 'response.data.redirectUrl' contains the PhonePe URL
    // We send it back as 'url' to match what the frontend expects.
    return NextResponse.json({
      success: true,
      url: response.redirectUrl, // <-- THE CRITICAL FIX
    });

  } catch (error: any) {
    console.error("SDK order creation error:", error);
    return NextResponse.json(
      { error: "Order creation failed", details: error.message },
      { status: 500 }
    );
  }
}
