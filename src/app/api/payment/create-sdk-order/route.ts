import { v4 as uuidv4 } from "uuid";
import { getPhonePeClient } from "@/lib/phonepeClient";
import { CreateSdkOrderRequest } from "@phonepe-pg/pg-sdk-node";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { amount, userId }: { amount: number; userId: string } = await req.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Generate short, customer-friendly order ID
    // Format: SIS-YYMMDD-XXXX (e.g., SIS-260111-4729)
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const randomDigits = Math.floor(1000 + Math.random() * 9000);

    const merchantOrderId = `SIS-${year}${month}${day}-${randomDigits}`;
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