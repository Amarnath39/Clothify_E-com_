import { getPhonePeClient } from "@/lib/phonepeClient";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const authorizationHeader = req.headers.get("authorization") || "";
    const body = await req.json();
    const responseBody = JSON.stringify(body);

    const isValid = await getPhonePeClient().validateCallback(
      process.env.MERCHANT_USERNAME as string,
      process.env.MERCHANT_PASSWORD as string,
      authorizationHeader,
      responseBody
    );

    if (!isValid) {
      console.error("Invalid callback received");
      return NextResponse.json({ error: "Invalid callback" }, { status: 401 });
    }

    const callbackData = body;
    const orderId = callbackData.payload.merchantOrderId as string;
    const status = callbackData.payload.state as string;

    // TODO: update DB with orderId + status

    switch (callbackData.type) {
      case "PAYMENT_SUCCESS":
        console.log("Payment successful for:", orderId);
        break;
      case "PAYMENT_ERROR":
        console.log("Payment failed for:", orderId);
        break;
      default:
        console.log("Unknown callback type:", callbackData.type);
    }

    return new Response("OK", { status: 200 });
  } catch (error: any) {
    console.error("Callback handling error:", error);
    return NextResponse.json(
      { error: "Callback processing failed", details: error.message },
      { status: 500 }
    );
  }
}