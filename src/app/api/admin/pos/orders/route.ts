import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../../db";
export const dynamic = 'force-dynamic';
import Order from "@/model/Order";
import RefundRequest from "@/model/RefundRequest";

/**
 * GET /api/admin/pos/orders
 * Fetch all POS orders with refund status
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

        // Fetch all refund requests for these orders
        const orderIds = orders.map((o: any) => o.orderId);
        const refundRequests = await RefundRequest.find({ orderId: { $in: orderIds } }).lean();

        // Create a map of orderId -> refund info
        const refundMap: Record<string, { isRefunded: boolean; refundedQty: number }> = {};
        refundRequests.forEach((r: any) => {
            const totalRefundedQty = r.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0;
            if (!refundMap[r.orderId]) {
                refundMap[r.orderId] = { isRefunded: false, refundedQty: 0 };
            }
            refundMap[r.orderId].isRefunded = true;
            refundMap[r.orderId].refundedQty += totalRefundedQty;
        });

        // Attach refund status to each order
        const ordersWithRefundStatus = orders.map((order: any) => {
            const totalOrderQty = order.productDetails?.reduce((sum: number, p: any) => sum + (p.count || p.quantity || 1), 0) || 0;
            const refundInfo = refundMap[order.orderId] || { isRefunded: false, refundedQty: 0 };
            const isFullyRefunded = refundInfo.refundedQty >= totalOrderQty;

            return {
                ...order,
                isRefunded: refundInfo.isRefunded,
                isFullyRefunded,
                refundedQty: refundInfo.refundedQty,
                totalOrderQty
            };
        });

        console.log(`✅ Found ${orders.length} POS orders`);

        return NextResponse.json(
            {
                success: true,
                orders: ordersWithRefundStatus,
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
