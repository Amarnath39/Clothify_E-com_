import { NextResponse } from "next/server";
import { sendUserOrderEmail } from "@/helper/sendUserOrderEmail";

export async function GET() {
    try {
        // Sample order data for testing
        const testOrder = {
            orderId: "SIS-260111-1234",
            tempTransactionId: "SIS-260111-1234",
            transactionId: "T2024011112345678",
            paymentStatus: "PAYMENT_SUCCESS",
            totalPrice: 1997,
            off: 996,
            shippingCost: 0,
            payablePrice: 1,
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
                pincode: "500048",
                phoneNumber: "07306205146"
            },
            productDetails: [
                {
                    product: {
                        name: "Premium Cotton Saree",
                        color: "Cream"
                    },
                    sizeLabel: "6XL",
                    offerPrice: 1,
                    count: 1
                }
            ]
        };

        console.log("📧 Sending test email to sangeet.s@webgeon.com...");

        const result = await sendUserOrderEmail(testOrder);

        return NextResponse.json({
            success: true,
            message: "Test email sent successfully!",
            emailResult: result,
            testData: {
                recipient: "sangeet.s@webgeon.com",
                orderId: testOrder.orderId
            }
        });

    } catch (error: any) {
        console.error("Test email error:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to send test email",
                details: error.message
            },
            { status: 500 }
        );
    }
}
