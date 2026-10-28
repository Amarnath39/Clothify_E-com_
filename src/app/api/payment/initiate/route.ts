import { v4 as uuidv4 } from "uuid";
import { getPhonePeClient } from "@/lib/phonepeClient";
import { StandardCheckoutPayRequest } from "@phonepe-pg/pg-sdk-node";
import { NextRequest, NextResponse } from "next/server";
import User from "../../../../model/User";
import Order from "../../../../model/Order";
import { connectDB } from "../../../../../db";


export async function POST(req: NextRequest) {
  try {
    await connectDB();
    // 1. Get userId from headers
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, msg: "Please provide User Id" },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
    }


    const body = await req.json();
    const { amount, orderId }: { amount: number; orderId: string } = body;


    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // 5. Verify order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 6. Generate short, customer-friendly order ID
    // Format: SIS-YYMMDD-XXXX (e.g., SIS-260111-4729)
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const randomDigits = Math.floor(1000 + Math.random() * 9000); // 4-digit random number

    const merchantOrderId = `SIS-${year}${month}${day}-${randomDigits}`;
    console.log(`Generated Order ID: ${merchantOrderId}`);

    const redirectUrl = `${process.env.MERCHANT_REDIRECT_URL}?orderId=${merchantOrderId}`;

    // Extract base URL from redirect URL to construct callback URL
    let callbackUrl = "https://sism.in/api/payment/callback"; // Default fallback
    try {
      if (process.env.MERCHANT_REDIRECT_URL) {
        const urlObj = new URL(process.env.MERCHANT_REDIRECT_URL);
        callbackUrl = `${urlObj.origin}/api/payment/callback`;
      }
    } catch (err) {
      console.warn("Could not derive callback URL from redirect URL, using fallback.");
    }

    console.log(`Using Callback URL: ${callbackUrl}`);

    // 7. Build PhonePe payment request
    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(amount * 100) // amount in paise
      .redirectUrl(redirectUrl)
      .build();

    // 8. Call PhonePe API
    const response = await getPhonePeClient().pay(request);

    // 9. Update order details in DB
    order.orderId = merchantOrderId;
    order.transactionId = merchantOrderId;
    order.tempTransactionId = merchantOrderId;
    order.currentStatus = "PENDING";
    order.paymentStatus = "INITIATED";
    order.date = new Date();

    await order.save();

    // 10. Return response
    return NextResponse.json({
      success: true,
      url: response.redirectUrl,
      orderId: merchantOrderId,
    });
  } catch (error: any) {
    console.error("Payment initiation error:", error);
    return NextResponse.json(
      { error: "Payment initiation failed", details: error.message },
      { status: 500 }
    );
  }
}