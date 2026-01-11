import Order from "@/model/Order";
import Product from "@/model/Product";
import StockHistory from "@/model/StockHistory";
import { sendAdminNotification } from "./notifications";

export const reduceStock = async (orderId: string) => {
    try {
        const order = await Order.findById(orderId).populate("productDetails.product");
        if (!order) {
            console.error(`Order not found: ${orderId}`);
            return false;
        }

        // ✅ Idempotency Check
        if (order.stockReduced) {
            console.log(`Stock already reduced for order: ${orderId}. Skipping.`);
            return true;
        }

        const allowedStatuses = ["CONFIRMED", "Processing", "Shipped", "Delivered", "COMPLETED"];
        const isOnlinePaid = order.paymentStatus === "PAYMENT_SUCCESS" || order.paymentStatus === "succeeded";
        const isConfirmedStatus = allowedStatuses.includes(order.currentStatus);

        if (!isOnlinePaid && !isConfirmedStatus) {
            console.log(`Order ${orderId} is not eligible for stock reduction. Payment: ${order.paymentStatus}, Status: ${order.currentStatus}`);
            return false;
        }

        console.log(`Reducing stock for order: ${orderId}`);

        for (const item of order.productDetails) {
            const product = await Product.findById(item.product._id);
            if (!product) continue;

            const sizeIndex = product.sizes.findIndex(
                (s: any) => s._id.toString() === item.sizeId.toString()
            );

            if (sizeIndex === -1) {
                console.error(`Size not found for product ${product.name} in order ${orderId}`);
                continue;
            }

            const oldStock = product.sizes[sizeIndex].stock;
            const quantityToReduce = item.count + (item.freeCount || 0);
            const newStock = oldStock - quantityToReduce;

            // Update Product Stock
            product.sizes[sizeIndex].stock = newStock;

            // Update Aggregate Fields
            product.totalStock = (product.totalStock || 0) - quantityToReduce;
            product.availableStock = (product.availableStock || 0) - quantityToReduce;

            await product.save();

            // Log to StockHistory
            await StockHistory.create({
                productId: product._id,
                orderId: order._id,
                sizeId: product.sizes[sizeIndex]._id,
                sizeLabel: item.sizeLabel,
                oldStock: oldStock,
                newStock: newStock,
                changeAmount: -quantityToReduce,
                action: "SALE",
                reason: `Order Placed: ${order.orderId}`,
            });

            // Check for Low Stock
            await checkLowStock(product);
        }

        // Mark Order as Stock Reduced
        order.stockReduced = true;
        await order.save();

        console.log(`Stock successfully reduced for order: ${orderId}`);
        return true;
    } catch (error) {
        console.error(`Failed to reduce stock for order ${orderId}:`, error);
        return false;
    }
};

export const restoreStock = async (orderId: string) => {
    try {
        const order = await Order.findById(orderId).populate("productDetails.product");
        if (!order) return false;

        if (!order.stockReduced) {
            console.log(`Stock was never reduced for order ${orderId}. No restoration needed.`);
            return true;
        }

        console.log(`Restoring stock for order: ${orderId}`);

        for (const item of order.productDetails) {
            const product = await Product.findById(item.product._id);
            if (!product) continue;

            const sizeIndex = product.sizes.findIndex(
                (s: any) => s._id.toString() === item.sizeId.toString()
            );

            if (sizeIndex === -1) continue;

            const oldStock = product.sizes[sizeIndex].stock;
            const quantityToRestore = item.count + (item.freeCount || 0);
            const newStock = oldStock + quantityToRestore;

            // Update Product Stock
            product.sizes[sizeIndex].stock = newStock;

            // Update Aggregate Fields
            product.totalStock = (product.totalStock || 0) + quantityToRestore;
            product.availableStock = (product.availableStock || 0) + quantityToRestore;

            await product.save();

            // Log to StockHistory
            await StockHistory.create({
                productId: product._id,
                orderId: order._id,
                sizeId: product.sizes[sizeIndex]._id,
                sizeLabel: item.sizeLabel,
                oldStock: oldStock,
                newStock: newStock,
                changeAmount: quantityToRestore,
                action: "CANCELLATION",
                reason: `Order Cancelled/Refunded: ${order.orderId}`,
            });
        }

        // Unmark stockReduced
        order.stockReduced = false;
        await order.save();

        console.log(`Stock successfully restored for order: ${orderId}`);
        return true;
    } catch (error) {
        console.error(`Failed to restore stock for order ${orderId}:`, error);
        return false;
    }
};

export const checkLowStock = async (product: any) => {
    try {
        const threshold = product.lowStockThreshold || 5;
        if (product.availableStock <= threshold) {
            await sendAdminNotification("LOW_STOCK", {
                productName: product.name,
                sku: product.sku,
                availableStock: product.availableStock,
                threshold: threshold,
            });
        }
    } catch (error) {
        console.error("Error checking low stock:", error);
    }
};
