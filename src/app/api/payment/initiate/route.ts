// /api/payment/initiate/route.ts
import { NextRequest, NextResponse } from "next/server";
import Order from "../../../../model/Order";
import { getPhonePeClient } from "@/lib/phonepeClient"; // Your PhonePe lib
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  try {
    // --- ADD THIS CHECK AT THE TOP ---
    const merchantId = process.env.MERCHANT_ID;
    if (!merchantId) {
      console.error("MERCHANT_ID is not set in environment variables.");
      return NextResponse.json(
        { success: false, msg: "Payment configuration error." },
        { status: 500 }
      );
    }
    // ------------------------------------

    const { orderId } = await req.json();
    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 1. Create a unique transaction ID for PhonePe
    const merchantTransactionId = `M${nanoid(10)}`;

    // 2. Create the payload for PhonePe
    const paymentPayload = {
      // --- CHANGE THIS LINE ---
      merchantId: merchantId, // Use the 'safe' variable
      // ------------------------
      merchantTransactionId: merchantTransactionId, // Unique ID for this *attempt*
      merchantUserId: order.user.toString(),
      amount: order.payablePrice * 100, // Amount in paise
      redirectUrl: `https://your-website.com/payment-status/${orderId}`,
      redirectMode: "REDIRECT",
      callbackUrl: `https://your-website.com/api/hook/phonepe/payment/${orderId}`,
      mobileNumber: order.shippingAddress.phone,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
      merchantOrderId: orderId, // Your internal order ID
      paymentFlow: "WEB_CHECKOUT", // Specify the flow
    };

    // 3. Call PhonePe to get the redirect URL
    const phonePeResponse = await getPhonePeClient().pay(paymentPayload as any);

    // 4. Get the URL from the response (use the correct shape and guard against missing fields)
    const redirectUrl =
      (phonePeResponse as any)?.instrumentResponse?.redirectInfo?.url ??
      (phonePeResponse as any)?.data?.instrumentResponse?.redirectInfo?.url;

    if (!redirectUrl) {
      console.error("No redirect URL in PhonePe response:", phonePeResponse);
      return NextResponse.json(
        { success: false, msg: "Payment gateway did not return a redirect URL." },
        { status: 502 }
      );
    }

    // 5. Save the transaction ID to your order
    order.merchantTransactionId = merchantTransactionId;
    await order.save();

    // 6. Send the redirect URL back to the client
    return NextResponse.json({ success: true, url: redirectUrl });

  } catch (error) {
    console.error("Failed to initiate payment:", error);
    return NextResponse.json(
      { success: false, msg: "Payment initiation failed" },
      { status: 500 }
    );
  }
}