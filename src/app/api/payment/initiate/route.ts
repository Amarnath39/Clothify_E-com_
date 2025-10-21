// /api/payment/initiate/route.ts
import { NextRequest, NextResponse } from "next/server";
import Order from "../../../../model/Order";
import { getPhonePeClient } from "@/lib/phonepeClient"; // Your PhonePe lib
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  try {
    // 1. --- Safety Check: Check for Merchant ID ---
    const merchantId = process.env.MERCHANT_ID;
    if (!merchantId) {
      console.error("MERCHANT_ID is not set in environment variables.");
      return NextResponse.json(
        { success: false, msg: "Payment configuration error." },
        { status: 500 }
      );
    }
    
    // 2. --- Get Order ---
    const { orderId } = await req.json();
    const order = await Order.findById(orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 3. --- Safety Check: Check for Phone Number (Fix for 500 Error) ---
    const mobileNumber = order.shippingAddress?.phone;
    if (!mobileNumber) {
      console.error(
        `Order ${orderId} is missing a shipping address phone number.`
      );
      return NextResponse.json(
        { success: false, msg: "Shipping address phone number is required." },
        { status: 400 } // 400 Bad Request
      );
    }

    // 4. --- Create a unique transaction ID for PhonePe ---
    const merchantTransactionId = `M${nanoid(10)}`;

    // 5. --- Create the payload for PhonePe ---
    const paymentPayload = {
      merchantId: merchantId, // Use the 'safe' variable
      merchantTransactionId: merchantTransactionId, // Unique ID for this *attempt*
      merchantUserId: order.user.toString(),
      amount: order.payablePrice * 100, // Amount in paise
      
     
      redirectUrl: `https://www.siskerala.com/payment-status/${orderId}`,
      redirectMode: "REDIRECT",
      callbackUrl: `https://www.siskerala.com/api/hook/phonepe/payment-status/${orderId}`,
 

      mobileNumber: mobileNumber, // Use the 'safe' variable
      paymentInstrument: {
        type: "PAY_PAGE",
      },
      merchantOrderId: orderId, // Your internal order ID
      paymentFlow: "WEB_CHECKOUT", // Specify the flow
    };

    // 6. --- Call PhonePe to get the redirect URL ---
    const phonePeResponse = await getPhonePeClient().pay(paymentPayload as any);

    // 7. --- Get the URL from the response (with safety checks) ---
    const redirectUrl =
      (phonePeResponse as any)?.instrumentResponse?.redirectInfo?.url ??
      (phonePeResponse as any)?.data?.instrumentResponse?.redirectInfo?.url;

    if (!redirectUrl) {
      console.error("No redirect URL in PhonePe response:", phonePeResponse);
      return NextResponse.json(
        {
          success: false,
          msg: "Payment gateway did not return a redirect URL.",
        },
        { status: 502 }
      );
    }

    // 8. --- Save the transaction ID to your order ---
    order.merchantTransactionId = merchantTransactionId;
    await order.save();

    // 9. --- Send the redirect URL back to the client ---
    return NextResponse.json({ success: true, url: redirectUrl });
    
  } catch (error) {
    console.error("Failed to initiate payment:", error);
    return NextResponse.json(
      { success: false, msg: "Payment initiation failed" },
      { status: 500 }
    );
  }
}