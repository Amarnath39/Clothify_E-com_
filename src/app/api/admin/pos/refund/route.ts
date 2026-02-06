import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../../db";
export const dynamic = 'force-dynamic';
import Order from "@/model/Order";
import Product from "@/model/Product";
import RefundRequest from "@/model/RefundRequest";
import mongoose from "mongoose";
import { updateStock } from "@/lib/stockManager";

export const POST = async (req: NextRequest) => {
    try {
        await connectDB();

        const body = await req.json();
        const { orderId, orderRef, type, items, reason, condition, createdBy } = body;

        // 1. Validate Basic Data
        if (!orderId || !items || items.length === 0) {
            return NextResponse.json({ success: false, message: "Invalid request data" }, { status: 400 });
        }

        // 2. Fetch Original Order
        // Try finding by _id first if orderRef provided, else orderId string
        const order = await Order.findOne({
            $or: [{ _id: orderRef }, { orderId: orderId }]
        });

        if (!order) {
            return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
        }

        // 3. Fetch Previous Refunds to Validate Quantity
        const previousRefunds = await RefundRequest.find({ orderRef: order._id }); // Use consistent reference

        const refundedMap: Record<string, number> = {};
        previousRefunds.forEach(ref => {
            ref.items.forEach((item: any) => {
                const key = `${item.product}_${item.sizeId}`;
                refundedMap[key] = (refundedMap[key] || 0) + item.quantity;
            });
        });

        console.log("🔍 Refunded Map:", JSON.stringify(refundedMap));

        interface IRefundItem {
            product: string;
            sizeId: string;
            quantity: number;
            amount: number;
        }

        // 4. Summarize Original Order Quantities (to handle duplicate line items)
        const purchasedMap: Record<string, { qty: number; unitPrice: number }> = {};
        let totalOrderOfferPrice = 0;

        console.log("🔍 Order productDetails:", JSON.stringify(order.productDetails));

        order.productDetails.forEach((p: any) => {
            // Convert ObjectIds to strings for proper key matching
            const productIdStr = p.product?.toString() || p.product;
            // Fallback chain: size._id -> sizeId -> item._id (for legacy orders without size)
            const sizeIdStr = p.size?._id?.toString() || p.sizeId?.toString() || p._id?.toString();
            const key = `${productIdStr}_${sizeIdStr}`;
            const qty = p.count || p.quantity || 1;
            const unitPrice = p.offerPrice || p.actualPrice || 0;

            console.log(`📦 Building key: ${key}, qty: ${qty}`);

            if (!purchasedMap[key]) {
                purchasedMap[key] = { qty: 0, unitPrice: unitPrice };
            }
            purchasedMap[key].qty += qty;
            totalOrderOfferPrice += unitPrice * qty;
        });


        console.log("🗺️ PurchasedMap:", JSON.stringify(purchasedMap));


        // 5. Validate & Prepare Items
        let totalRefundAmount = 0;
        const validItems: IRefundItem[] = [];

        // Ratio for proportional discount/GST distribution
        const refundRatio = totalOrderOfferPrice > 0 ? (order.payablePrice / totalOrderOfferPrice) : 1;

        for (const item of items) {
            const key = `${item.productId}_${item.sizeId}`;
            const purchasedData = purchasedMap[key];

            if (!purchasedData) {
                return NextResponse.json({ success: false, message: `Item not found in order: ${item.productId}` }, { status: 400 });
            }

            const purchasedQty = purchasedData.qty;
            const alreadyRefunded = refundedMap[key] || 0;
            const maxRefundable = purchasedQty - alreadyRefunded;

            console.log(`📊 Item ${item.productId} (${item.sizeId}): Purchased=${purchasedQty}, AlreadyRefunded=${alreadyRefunded}, Requested=${item.quantity}`);

            if (item.quantity > maxRefundable) {
                console.error(`❌ Validation Failed: Requested ${item.quantity} > Available ${maxRefundable}`);
                return NextResponse.json({
                    success: false,
                    message: `Cannot refund ${item.quantity}. Max available: ${maxRefundable} for item ${item.productId}. (Purchased: ${purchasedQty}, Already Refunded: ${alreadyRefunded})`,
                    debug: {
                        productId: item.productId,
                        sizeId: item.sizeId,
                        purchasedQty,
                        alreadyRefunded,
                        refundedMap,
                        previousRefundRecords: previousRefunds.map(r => ({ id: r._id, items: r.items, createdAt: r.createdAt }))
                    }
                }, { status: 400 });
            }

            // Calculate Proportional Refund Amount
            // (Item Offer Price * Proportional Ratio) * Quantity
            const refundAmount = (purchasedData.unitPrice * refundRatio) * item.quantity;
            totalRefundAmount += refundAmount;

            validItems.push({
                product: item.productId,
                sizeId: item.sizeId,
                quantity: item.quantity,
                amount: refundAmount
            });
        }

        // 5. Stock Update (If Good Condition)
        if (condition === "GOOD" && validItems.length > 0) {
            const stockUpdateItems = validItems.map(item => ({
                productId: item.product,
                sizeId: item.sizeId,
                quantity: item.quantity
            }));

            const stockResult = await updateStock(
                stockUpdateItems,
                "REFUND",
                "POS",
                order.orderId,
                createdBy
            );

            if (!stockResult.success) {
                console.error("❌ Stock update failed during refund:", stockResult.errors);
                // CRITICAL: Abort refund, do NOT create RefundRequest if stock update fails
                return NextResponse.json({
                    success: false,
                    message: "Stock update failed. Refund aborted.",
                    errors: stockResult.errors
                }, { status: 500 });
            }
            console.log("✅ Refund stock updated successfully");
        }

        // If DAMAGED, we do nothing to stock (it's lost).

        // 6. Create Refund Record
        const refundRequest = await RefundRequest.create({
            orderId: order.orderId,
            orderRef: order._id,
            type,
            reason,
            condition,
            items: validItems,
            totalAmount: totalRefundAmount,
            status: "COMPLETED",
            createdBy
        });

        return NextResponse.json({ success: true, refundRequest });

    } catch (error: any) {
        console.error("Refund Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
};

/**
 * DELETE /api/admin/pos/refund
 * Clears stale/duplicate refund records for a specific order.
 * Use this if a previous refund attempt failed but left a record behind.
 * 
 * Body: { orderRef: string (Order._id) } OR { orderId: string }
 */
export const DELETE = async (req: NextRequest) => {
    try {
        await connectDB();

        const body = await req.json();
        const { orderRef, orderId } = body;

        if (!orderRef && !orderId) {
            return NextResponse.json({ success: false, message: "Please provide orderRef or orderId" }, { status: 400 });
        }

        // Find and delete refund requests for this order
        const query = orderRef ? { orderRef } : { orderId };
        const deletedRecords = await RefundRequest.deleteMany(query);

        console.log(`🗑️ Deleted ${deletedRecords.deletedCount} RefundRequest records for order: ${orderRef || orderId}`);

        return NextResponse.json({
            success: true,
            message: `Cleared ${deletedRecords.deletedCount} refund record(s). You can now retry the refund.`,
            deletedCount: deletedRecords.deletedCount
        });

    } catch (error: any) {
        console.error("Delete Refund Error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
};
