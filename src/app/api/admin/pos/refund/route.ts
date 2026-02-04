import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../../db";
export const dynamic = 'force-dynamic';
import Order from "@/model/Order";
import Product from "@/model/Product";
import RefundRequest from "@/model/RefundRequest";
import mongoose from "mongoose";

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

        interface IRefundItem {
            product: string;
            sizeId: string;
            quantity: number;
            amount: number;
        }

        // 4. Validate & Prepare Items
        let totalRefundAmount = 0;
        const validItems: IRefundItem[] = [];

        for (const item of items) {
            const originalItem = order.productDetails.find((p: any) =>
                p.product.toString() === item.productId &&
                p.size._id.toString() === item.sizeId
            );

            if (!originalItem) {
                return NextResponse.json({ success: false, message: `Item not found in order: ${item.productId}` }, { status: 400 });
            }

            const purchasedQty = originalItem.count;
            const key = `${item.productId}_${item.sizeId}`;
            const alreadyRefunded = refundedMap[key] || 0;
            const maxRefundable = purchasedQty - alreadyRefunded;

            if (item.quantity > maxRefundable) {
                return NextResponse.json({
                    success: false,
                    message: `Cannot refund ${item.quantity}. Max available: ${maxRefundable} for item ${item.productId}`
                }, { status: 400 });
            }

            // Calculate Amount (Simple logic: Unit Price * Qty)
            // Unit Price = (payablePrice of item / count) or logic from POS? 
            // In POS `total` was stored. Let's assume we pass amount or calculate it.
            // Order doesn't strictly store unit price in all history, but `payablePrice` per item?
            // `productDetails` used `price` in POS? 
            // Let's rely on info from Order if available, else derive.
            // Use (originalItem.total / originalItem.count) * refundQty
            // Wait, Order schema `productDetails` has `count`. Does it have `total`? 
            // Step 698 `processedProductDetails` didn't explicitly show `total` or `price` saved to DB? 
            // Wait, looking at Step 698: `productDetails` usage in Schema... 
            // Schema (Step 685) `productDetails` is array of subdocs. It does NOT have `price` field defined in Schema!
            // It just has `product`, `size`, `count`.
            // The `Order` object has `totalPrice`, `payablePrice`.
            // This is a flaw in the existing schema for partial refunds.
            // WORKAROUND: Use Product's current price OR pass it from frontend which calculates it based on `order.totalPrice` / `totalItems` (approx) or looks up product? 
            // Best: Fetch Product Price Now? No, historical price matters.
            // If historical price is lost, we assume Proportional based on `order.payablePrice`.

            // Logic: (Order Payable / Total Items Count) * Refund Qty. (Crude but working for V1).
            // OR: Since it's POS, maybe we just require Manual Amount Entry for Refund?
            // Prompt says "Calculate refund amount (tax + discounts proportional)".
            // I'll implement Proportional.

            const orderTotalItems = order.productDetails.reduce((sum: number, i: any) => sum + i.count, 0);
            const unitRefundValue = order.payablePrice / orderTotalItems;
            const refundAmount = unitRefundValue * item.quantity;

            totalRefundAmount += refundAmount;

            validItems.push({
                product: item.productId,
                sizeId: item.sizeId,
                quantity: item.quantity,
                amount: refundAmount
            });

            // 5. Stock Update (If Good Condition)
            if (condition === "GOOD") {
                await Product.updateOne(
                    { _id: item.productId, "sizes._id": item.sizeId },
                    { $inc: { "sizes.$.stock": item.quantity } }
                );
            }
            // If DAMAGED, we do nothing to stock (it's lost).
        }

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
