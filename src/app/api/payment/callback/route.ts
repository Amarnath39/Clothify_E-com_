import { getPhonePeClient } from "@/lib/phonepeClient";
import { NextResponse } from "next/server";
import { connectDB } from "../../../../../db";
import Order from "@/model/Order";

export async function POST(req: Request) {
  try {
    await connectDB();
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

    console.log("PhonePe Callback received:", callbackData);

    // ✅ Idempotency check - prevent duplicate processing
    const existingOrder = await Order.findOne({ tempTransactionId: orderId });
    if (!existingOrder) {
      console.warn(`Callback received for non-existent order: ${orderId}`);
      return new Response("OK", { status: 200 }); // Return OK to prevent retries
    }

    if (existingOrder.paymentStatus === "PAYMENT_SUCCESS") {
      console.log(`Order ${orderId} already processed. Ignoring duplicate callback.`);
      return new Response("OK", { status: 200 });
    }

    switch (callbackData.code) {
      case "PAYMENT_SUCCESS":
        console.log("Payment successful for:", orderId);

        const updateData: any = {
          paymentStatus: "PAYMENT_SUCCESS",
          transactionId: callbackData.payload.transactionId,
          currentStatus: "CONFIRMED",
          paymentMethod: callbackData.payload.paymentInstrument?.type || "ONLINE",
          paymentVerifiedAt: new Date(),
        };

        if (callbackData.payload.merchantTransactionId) {
          updateData.phonePeReferenceId = callbackData.payload.merchantTransactionId;
        }

        await Order.findOneAndUpdate(
          { tempTransactionId: orderId },
          updateData
        );
        break;
      case "PAYMENT_ERROR":
        console.log("Payment failed for:", orderId);
        await Order.findOneAndUpdate(
          { tempTransactionId: orderId },
          {
            paymentStatus: "PAYMENT_ERROR",
            currentStatus: "FAILED",
          }
        );
        break;
      default:
        console.log("Unknown callback type:", callbackData.code);
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