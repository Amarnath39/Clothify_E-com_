import { NextRequest, NextResponse } from "next/server";
import Order from "@/model/Order";
import { connectDB } from "@/../db";

interface Params {
    params: { orderId: string };
}

export async function GET(req: NextRequest, { params }: Params) {
    try {
        await connectDB();

        // No authentication required - anyone can print shipping labels for paid orders
        const { orderId } = params;

        // ✅ Fetch order - check both tempTransactionId and orderId for backward compatibility
        const order = await Order.findOne({
            $or: [
                { tempTransactionId: orderId },
                { orderId: orderId }
            ]
        });

        if (!order) {
            return NextResponse.json(
                { success: false, error: "Order not found" },
                { status: 404 }
            );
        }

        // ✅ Validate payment status
        if (order.paymentStatus !== "PAYMENT_SUCCESS") {
            return NextResponse.json(
                {
                    success: false,
                    error: "Shipping label can only be generated for confirmed payments",
                    paymentStatus: order.paymentStatus,
                },
                { status: 400 }
            );
        }

        // ✅ Validate AWB exists
        if (!order.dtdc?.referenceNumber) {
            return NextResponse.json(
                {
                    success: false,
                    error: "AWB reference number not generated yet. Please ensure order has been processed.",
                },
                { status: 400 }
            );
        }

        const referenceNumber = order.dtdc.referenceNumber;

        // ✅ Call DTDC Shipping Label API
        console.log(
            `📄 Fetching shipping label for order ${orderId}, AWB: ${referenceNumber}`
        );

        const dtdcApiUrl = new URL(
            "/api/customer/integration/consignment/shippinglabel/stream",
            "https://dtdcapi.shipsy.io"
        );
        dtdcApiUrl.searchParams.set("reference_number", referenceNumber);
        dtdcApiUrl.searchParams.set("label_code", "SHIP_LABEL_4X6");
        dtdcApiUrl.searchParams.set("label_format", "pdf");

        // Debug: Check if API key is available
        const apiKey = process.env.DTDC_API_KEY || "52256c0d05c94bda4c897dce29a485";
        console.log(`🔑 DTDC API Key present: ${apiKey ? 'YES (length: ' + apiKey.length + ')' : 'NO - MISSING!'}`);
        console.log(`📡 Calling DTDC API: ${dtdcApiUrl.toString()}`);

        const dtdcResponse = await fetch(dtdcApiUrl.toString(), {
            method: "GET",
            headers: {
                "Accept": "application/pdf",
                "api-key": apiKey,
            },
        });

        if (!dtdcResponse.ok) {
            const errorText = await dtdcResponse.text();
            console.error(
                `❌ DTDC API error for order ${orderId}:`,
                dtdcResponse.status,
                errorText
            );

            return NextResponse.json(
                {
                    success: false,
                    error: "Failed to fetch shipping label from DTDC",
                    details: errorText,
                    dtdcStatus: dtdcResponse.status,
                },
                { status: 500 }
            );
        }

        // ✅ Stream PDF response to client
        const pdfBlob = await dtdcResponse.blob();

        console.log(
            `✅ Shipping label fetched successfully for order ${orderId}`
        );

        // ✅ Trigger Shipping Notification Email (if not sent yet)
        if (!order.isShippingEmailSent) {
            console.log("📧 Sending shipping notification email for the first time...");

            // Send email asynchronously without blocking the PDF download
            // We use Promise.allSettled to ensure we don't crash if email fails, 
            // though ideally we'd want to await it to ensure DB update happens.
            // Since this is a critical flow, we'll await a quick DB update.

            try {
                // 1. Send Email
                const { sendShippingNotificationEmail } = await import("@/helper/sendShippingNotificationEmail");
                await sendShippingNotificationEmail(order);

                // 2. Mark as sent in DB
                await Order.findByIdAndUpdate(order._id, { isShippingEmailSent: true });
                console.log("✅ Marked shipping email as sent in DB");

            } catch (emailErr) {
                console.error("⚠️ Failed to send shipping email in background:", emailErr);
            }
        }

        return new NextResponse(pdfBlob, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="shipping-label-${orderId}.pdf"`,
            },
        });
    } catch (error: any) {
        console.error("Shipping label error:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Internal server error while fetching shipping label",
                details: error.message,
            },
            { status: 500 }
        );
    }
}
