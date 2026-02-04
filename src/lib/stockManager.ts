
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
 * Works with or without MongoDB transactions (standalone vs replica set).
 */
export const updateStock = async (
    items: StockUpdateItem[],
    action: "SALE" | "REFUND" | "RETURN" | "ADJUSTMENT",
    source: StockSource,
    referenceId: string, // Order ID or Refund ID
    adminId?: string
): Promise<StockUpdateResult> => {
    console.log(`🔄 Starting stock update: ${action} for ${items.length} items`);

    // Try with transactions first, fall back to non-transactional on error
    let useTransactions = false;
    let session: mongoose.ClientSession | null = null;

    try {
        // Attempt to start a session
        session = await mongoose.startSession();
        await session.startTransaction();
        useTransactions = true;
        console.log("✅ Using transactional stock update");
    } catch (sessionError: any) {
        console.log("⚠️ Transactions not supported, using non-transactional mode:", sessionError.message);
        useTransactions = false;
        session = null;
    }

    try {
        const errors: string[] = [];

        for (const item of items) {
            console.log(`Processing item: ${item.productId} / ${item.sizeId}`);

            // Fetch product (with or without session)
            const product = session
                ? await Product.findById(item.productId).session(session)
                : await Product.findById(item.productId);

            if (!product) {
                errors.push(`Product not found: ${item.productId}`);
                console.error(`❌ Product not found: ${item.productId}`);
                continue;
            }

            const sizeObj = product.sizes.find((s: any) => s._id.toString() === item.sizeId);

            if (!sizeObj) {
                errors.push(`Size not found for product: ${product.name}`);
                console.error(`❌ Size not found for product: ${product.name}`);
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
                console.error(`❌ Insufficient stock for ${product.name} (${sizeObj.size})`);
                continue;
            }

            // Update Stock
            const oldStock = sizeObj.stock;
            sizeObj.stock += changeAmount;
            sizeObj.sellCount = (sizeObj.sellCount || 0) + (-changeAmount);
            product.sellCount = (product.sellCount || 0) + (-changeAmount);

            // Explicitly mark sizes as modified to ensure Mongoose detects the change
            product.markModified('sizes');

            console.log(`📦 Stock Update: ${product.name} (${sizeObj.size}) -> Old: ${oldStock}, New: ${sizeObj.stock}, Change: ${changeAmount}`);

            // Save product
            if (session) {
                await product.save({ session });
            } else {
                await product.save();
            }

            // Create History Entry
            try {
                if (session) {
                    await StockHistory.create([{
                        productId: item.productId,
                        orderId: referenceId,
                        sizeId: item.sizeId,
                        sizeLabel: sizeObj.size || item.sizeLabel,
                        oldStock: oldStock,
                        newStock: sizeObj.stock,
                        changeAmount: changeAmount,
                        action: action,
                        reason: `${source} ${action} - ${referenceId}`,
                        adminId: adminId || "SYSTEM"
                    }], { session });
                } else {
                    await StockHistory.create({
                        productId: item.productId,
                        orderId: referenceId,
                        sizeId: item.sizeId,
                        sizeLabel: sizeObj.size || item.sizeLabel,
                        oldStock: oldStock,
                        newStock: sizeObj.stock,
                        changeAmount: changeAmount,
                        action: action,
                        reason: `${source} ${action} - ${referenceId}`,
                        adminId: adminId || "SYSTEM"
                    });
                }
                console.log(`✅ History entry created for ${product.name}`);
            } catch (historyError: any) {
                console.error("⚠️ Failed to create stock history:", historyError.message);
                // Don't fail the entire operation if history fails
            }
        }

        if (errors.length > 0) {
            console.error("❌ Stock Update Errors:", errors);
            if (session && useTransactions) {
                await session.abortTransaction();
            }
            return { success: false, errors };
        }

        if (session && useTransactions) {
            await session.commitTransaction();
            console.log("✅ Stock Transaction Committed");
        } else {
            console.log("✅ Stock Updated (Non-Transactional)");
        }

        return { success: true };

    } catch (error: any) {
        console.error("❌ Stock update failed:", error);
        console.error("Error stack:", error.stack);

        if (session && useTransactions) {
            try {
                await session.abortTransaction();
            } catch (abortError) {
                console.error("Failed to abort transaction:", abortError);
            }
        }

        return { success: false, errors: [error.message || "Unknown error during stock update"] };
    } finally {
        if (session) {
            try {
                session.endSession();
            } catch (endError) {
                console.error("Failed to end session:", endError);
            }
        }
    }
};
