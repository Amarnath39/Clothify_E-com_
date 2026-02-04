import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../../db";
export const dynamic = 'force-dynamic';
import Order from "@/model/Order";

/**
 * GET /api/admin/pos/orders
 * Fetch all POS orders
 */
export const GET = async (req: NextRequest) => {
    try {
        await connectDB();

        const adminId = req.headers.get("x-admin-id");

        if (!adminId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        // Fetch all POS orders
        const orders = await Order.find({ order_type: "POS" })
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 })
            .limit(200) // Limit to last 200 orders
            .lean();

        console.log(`✅ Found ${orders.length} POS orders`);

        return NextResponse.json(
            {
                success: true,
                orders,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("❌ POS orders fetch failed:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch POS orders",
                error: error.message,
            },
            { status: 500 }
        );
    }
};
