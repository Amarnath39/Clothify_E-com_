
import Product from "@/model/Product";
import StockHistory from "@/model/StockHistory";
import mongoose from "mongoose";

/**
 * Sources for stock updates
 */
export type StockSource = "ONLINE" | "POS" | "OFFLINE";

interface StockUpdateItem {
    productId: string;
    sizeId: string;
    quantity: number;
    productName?: string; // For logging
    sizeLabel?: string;   // For logging
}

interface StockUpdateResult {
    success: boolean;
    errors?: string[];
}

/**
 * ✅ Centralized Stock Update Function
 * Handles atomic updates, validation, and history logging.
 */
export const updateStock = async (
    items: StockUpdateItem[],
    action: "SALE" | "REFUND" | "RETURN" | "ADJUSTMENT",
    source: StockSource,
    referenceId: string, // Order ID or Refund ID
    adminId?: string
): Promise<StockUpdateResult> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const errors: string[] = [];

        for (const item of items) {
            const product = await Product.findById(item.productId).session(session);

            if (!product) {
                errors.push(`Product not found: ${item.productId}`);
                continue;
            }

            const sizeObj = product.sizes.find((s: any) => s._id.toString() === item.sizeId);

            if (!sizeObj) {
                errors.push(`Size not found for product: ${product.name}`);
                continue;
            }

            // Calculate new stock
            let changeAmount = 0;
            if (action === "SALE") {
                changeAmount = -item.quantity;
            } else if (["REFUND", "RETURN", "ADJUSTMENT"].includes(action)) {
                changeAmount = item.quantity;
            }

            // Validation for deductions
            if (changeAmount < 0 && sizeObj.stock + changeAmount < 0) {
                errors.push(`Insufficient stock for ${product.name} (${sizeObj.size}). Available: ${sizeObj.stock}, Requested: ${item.quantity}`);
                continue;
            }

            // Update Stock
            // We use direct array update via mongoose for atomicity within session
            // Note: mongoose findOneAndUpdate with session is cleaner if we wasn't iterating on a doc we already fetched,
            // but since we need to validate *multiple* items before committing *any*, we do this inside the transaction.

            // However, modifying the doc and saving is also valid in a transaction.
            sizeObj.stock += changeAmount;
            sizeObj.sellCount = (sizeObj.sellCount || 0) + (-changeAmount); // Increment sell count on sale
            product.sellCount = (product.sellCount || 0) + (-changeAmount);

            // Save product
            await product.save({ session });

            // Create History Entry
            await StockHistory.create([{
                productId: item.productId,
                orderId: referenceId,
                sizeId: item.sizeId,
                sizeLabel: sizeObj.size || item.sizeLabel,
                oldStock: sizeObj.stock - changeAmount,
                newStock: sizeObj.stock,
                changeAmount: changeAmount,
                action: action,
                reason: `${source} ${action} - ${referenceId}`,
                adminId: adminId || "SYSTEM"
            }], { session });
        }

        if (errors.length > 0) {
            await session.abortTransaction();
            return { success: false, errors };
        }

        await session.commitTransaction();
        return { success: true };

    } catch (error: any) {
        await session.abortTransaction();
        console.error("Stock update failed:", error);
        return { success: false, errors: [error.message] };
    } finally {
        session.endSession();
    }
};
