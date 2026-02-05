
import Product from "@/model/Product";
import StockHistory from "@/model/StockHistory";

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
 * ✅ Centralized Stock Update Function (NO TRANSACTIONS)
 * Simple, direct updates that work on ANY MongoDB setup
 */
export const updateStock = async (
    items: StockUpdateItem[],
    action: "SALE" | "REFUND" | "RETURN" | "ADJUSTMENT",
    source: StockSource,
    referenceId: string, // Order ID or Refund ID
    adminId?: string
): Promise<StockUpdateResult> => {
    console.log(`🔄 Starting stock update WITHOUT TRANSACTIONS: ${action} for ${items.length} items`);

    try {
        const errors: string[] = [];
        const updatedProducts: string[] = [];

        for (const item of items) {
            console.log(`📦 Processing: productId=${item.productId}, sizeId=${item.sizeId}, quantity=${item.quantity}`);

            // Fetch product
            const product = await Product.findById(item.productId);

            if (!product) {
                const error = `Product not found: ${item.productId}`;
                console.error(`❌ ${error}`);
                errors.push(error);
                continue;
            }

            console.log(`✅ Found product: ${product.name}`);

            // Find size
            const sizeIndex = product.sizes.findIndex((s: any) => s._id.toString() === item.sizeId);

            if (sizeIndex === -1) {
                const error = `Size not found for product: ${product.name} (sizeId: ${item.sizeId})`;
                console.error(`❌ ${error}`);
                errors.push(error);
                continue;
            }

            const sizeObj = product.sizes[sizeIndex];
            console.log(`✅ Found size: ${sizeObj.size}, current stock: ${sizeObj.stock}`);

            // Calculate new stock
            let changeAmount = 0;
            if (action === "SALE") {
                changeAmount = -item.quantity;
            } else if (["REFUND", "RETURN", "ADJUSTMENT"].includes(action)) {
                changeAmount = item.quantity;
            }

            // Validation for deductions
            const newStock = sizeObj.stock + changeAmount;
            if (newStock < 0) {
                const error = `Insufficient stock for ${product.name} (${sizeObj.size}). Available: ${sizeObj.stock}, Requested: ${item.quantity}`;
                console.error(`❌ ${error}`);
                errors.push(error);
                continue;
            }

            // Store old stock for history
            const oldStock = sizeObj.stock;

            // Update Stock directly
            product.sizes[sizeIndex].stock = newStock;
            product.sizes[sizeIndex].sellCount = (sizeObj.sellCount || 0) + (-changeAmount);
            product.sellCount = (product.sellCount || 0) + (-changeAmount);

            // Mark as modified
            product.markModified('sizes');

            console.log(`📦 Stock Update: ${product.name} (${sizeObj.size}) -> Old: ${oldStock}, New: ${newStock}, Change: ${changeAmount}`);

            // Save product
            try {
                await product.save();
                console.log(`✅ Product saved: ${product.name}`);
                updatedProducts.push(product.name);
            } catch (saveError: any) {
                const error = `Failed to save product ${product.name}: ${saveError.message}`;
                console.error(`❌ ${error}`);
                errors.push(error);
                continue;
            }

            // Create History Entry
            try {
                await StockHistory.create({
                    productId: item.productId,
                    orderId: referenceId,
                    sizeId: item.sizeId,
                    sizeLabel: sizeObj.size || item.sizeLabel,
                    oldStock: oldStock,
                    newStock: newStock,
                    changeAmount: changeAmount,
                    action: action,
                    reason: `${source} ${action} - ${referenceId}`,
                    adminId: adminId || "SYSTEM"
                });
                console.log(`✅ History entry created for ${product.name}`);
            } catch (historyError: any) {
                console.error(`⚠️ Failed to create stock history: ${historyError.message}`);
                // Don't fail the entire operation if history fails
            }
        }

        if (errors.length > 0) {
            console.error(`❌ Stock Update Failed with ${errors.length} error(s):`, errors);
            return { success: false, errors };
        }

        console.log(`✅ Stock Updated Successfully for: ${updatedProducts.join(', ')}`);
        return { success: true };

    } catch (error: any) {
        console.error("❌ Stock update crashed:", error);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);

        return {
            success: false,
            errors: [`Critical error: ${error.message || "Unknown error during stock update"}`]
        };
    }
};
