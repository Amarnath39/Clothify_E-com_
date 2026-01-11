import { NextResponse } from "next/server";
import { sendShippingNotificationEmail } from "@/helper/sendShippingNotificationEmail";

export async function GET() {
    try {
        // Sample order data for testing shipping notification
        const testOrder = {
            orderId: "SIS-260111-5678",
            tempTransactionId: "SIS-260111-5678",
            customerEmail: "sangeet.s@webgeon.com",
            user: {
                email: "sangeet.s@webgeon.com"
            },
            shippingAddress: {
                fullname: "Sangeet Shaji",
                houseNumber: "GF 42, United Arcade Building",
                area: "Attapur",
                district: "K.V.Rangareddy",
                state: "Telangana",
                pincode: "500048"
            },
            dtdc: {
                referenceNumber: "8677597922" // Sample AWB number
            }
        };

        console.log("📧 Sending test shipping notification email to sangeet.s@webgeon.com...");

        const result = await sendShippingNotificationEmail(testOrder);

        return NextResponse.json({
            success: true,
            message: "Test shipping notification email sent successfully!",
            emailResult: result,
            testData: {
                recipient: "sangeet.s@webgeon.com",
                orderId: testOrder.orderId,
                trackingNumber: testOrder.dtdc.referenceNumber
            }
        });

    } catch (error: any) {
        console.error("Test shipping email error:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to send test shipping notification",
                details: error.message
            },
            { status: 500 }
        );
    }
}
