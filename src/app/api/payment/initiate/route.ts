import { v4 as uuidv4 } from "uuid";
import { getPhonePeClient } from "@/lib/phonepeClient";
import { StandardCheckoutPayRequest } from "pg-sdk-node";
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

    // 6. Generate merchant order ID
    const merchantOrderId = `ORDER_${uuidv4()}`;
    const redirectUrl = `${process.env.MERCHANT_REDIRECT_URL}?orderId=${merchantOrderId}`;

    // 7. Build PhonePe payment request
    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(amount * 100) // amount in paise
      .redirectUrl(redirectUrl)
      .build();

    // builder does not expose callbackUrl, set it on the built request object
    (request as any).callbackUrl = `https://www.siskerala.com/api/hook/phonepe/payment-status/${orderId}`;

    // 8. Call PhonePe API
    const response = await getPhonePeClient().pay(request);

    // 9. Update order details in DB
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