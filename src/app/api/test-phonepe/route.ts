import { NextRequest, NextResponse } from "next/server";
import { getPhonePeClient } from "@/lib/phonepeClient";
export const dynamic = "force-dynamic";

/**
 * TEST ENDPOINT: Check if PhonePe API is reachable
 * Usage: GET /api/test-phonepe?orderId=YOUR_ORDER_ID
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const orderId = searchParams.get("orderId");

        if (!orderId) {
            return NextResponse.json({
                success: false,
                error: "Please provide orderId in query params",
                example: "/api/test-phonepe?orderId=ORDER_xxx",
            });
        }

        console.log(`\n========== TESTING PHONEPE API ==========`);
        console.log(`Testing orderId: ${orderId}`);
        console.log(`PhonePe Environment: ${process.env.PHONEPE_ENV}`);
        console.log(`PhonePe Client ID: ${process.env.PHONEPE_CLIENT_ID?.substring(0, 10)}...`);
        console.log(`==========================================\n`);

        const client = getPhonePeClient();
        console.log("✅ PhonePe client initialized");

        try {
            const response = await client.getOrderStatus(orderId);
            console.log("✅ PhonePe API Response received:");
            console.log(JSON.stringify(response, null, 2));

            return NextResponse.json({
                success: true,
                message: "PhonePe API is working!",
                orderId,
                response: response,
                environment: process.env.PHONEPE_ENV,
            });
        } catch (apiError: any) {
            console.error("❌ PhonePe API Error:");
            console.error("Error message:", apiError.message);
            console.error("Error stack:", apiError.stack);
            console.error("Response data:", apiError.response?.data);

            return NextResponse.json({
                success: false,
                error: "PhonePe API call failed",
                details: {
                    message: apiError.message,
                    data: apiError.response?.data,
                    status: apiError.response?.status,
                },
                environment: process.env.PHONEPE_ENV,
                orderId,
            }, { status: 500 });
        }
    } catch (error: any) {
        console.error("❌ Test endpoint error:", error);
        return NextResponse.json({
            success: false,
            error: "Test failed",
            details: error.message,
        }, { status: 500 });
    }
}
