import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/../db";
import Order from "@/model/Order";
import Product from "@/model/Product";
import StockHistory from "@/model/StockHistory";
import Admin from "@/model/Admin";
import mongoose from "mongoose";

connectDB();

/**
 * ✅ Generate unique POS invoice number
 * Format: POS-YYYYMMDD-0001
 */
const generatePOSInvoiceNumber = async (): Promise<string> => {
    try {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD

        // Find the last POS order today
        const todayStart = new Date(today.setHours(0, 0, 0, 0));
        const todayEnd = new Date(today.setHours(23, 59, 59, 999));

        const lastPOSOrder = await Order.findOne({
            order_type: "POS",
            createdAt: { $gte: todayStart, $lte: todayEnd },
        })
            .sort({ createdAt: -1 })
            .select("invoiceId")
            .lean() as { invoiceId: string } | null;

        let sequenceNumber = 1;

        if (lastPOSOrder?.invoiceId) {
            // Extract sequence from last invoice (POS-YYYYMMDD-0001)
            const parts = lastPOSOrder.invoiceId.split("-");
            if (parts.length === 3) {
                const lastSeq = parseInt(parts[2]);
                sequenceNumber = lastSeq + 1;
            }
        }

        const paddedSeq = sequenceNumber.toString().padStart(4, "0");
        return `POS-${dateStr}-${paddedSeq}`;
    } catch (error) {
        console.error("Error generating POS invoice number:", error);
        throw error;
    }
};

/**
 * ✅ Generate sequential order ID for POS
 */
const generatePOSOrderId = async (): Promise<{ orderId: string; orderSeq: number }> => {
    try {
        const lastOrder = await Order.findOne()
            .sort({ orderSeq: -1 })
            .select("orderSeq")
            .lean() as { orderSeq: number } | null;

        const nextSeq = (lastOrder?.orderSeq || 1799) + 1;
        return {
            orderId: `ON-${nextSeq.toString().padStart(6, "0")}`,
            orderSeq: nextSeq,
        };
    } catch (error) {
        console.error("Error generating POS order ID:", error);
        throw error;
    }
};

/**
 * 🔥 CRITICAL: Stock Reduction with Atomic Safety
 * This function MUST succeed for the POS order to be valid
 */
const reduceStockForPOS = async (
    productDetails: any[],
    orderId: string,
    adminId: string
): Promise<{ success: boolean; errors?: string[] }> => {
    const stockErrors: string[] = [];
    const stockUpdates: any[] = [];

    try {
        // ✅ Step 1: Validate stock availability BEFORE any updates
        for (const item of productDetails) {
            const product = await Product.findById(item.product);

            if (!product) {
                stockErrors.push(`Product ${item.product} not found`);
                continue;
            }

            const sizeObj = product.sizes?.find(
                (s: any) => s._id.toString() === item.sizeId
            );

            if (!sizeObj) {
                stockErrors.push(`Size not found for product ${product.name}`);
                continue;
            }

            const requiredQty = item.quantity;

            if (sizeObj.stock < requiredQty) {
                stockErrors.push(
                    `Insufficient stock for ${product.name} (${sizeObj.size}): Need ${requiredQty}, Have ${sizeObj.stock}`
                );
                continue;
            }

            // Store for batch update
            stockUpdates.push({
                productId: product._id,
                sizeId: sizeObj._id,
                oldStock: sizeObj.stock,
                newStock: sizeObj.stock - requiredQty,
                changeAmount: -requiredQty,
                productName: product.name,
                sizeLabel: sizeObj.size,
            });
        }

        // ✅ Step 2: If ANY stock validation failed, ABORT
        if (stockErrors.length > 0) {
            console.error("❌ Stock validation failed:", stockErrors);
            return { success: false, errors: stockErrors };
        }

        // ✅ Step 3: Perform atomic stock updates
        for (const update of stockUpdates) {
            // Update product stock
            await Product.findOneAndUpdate(
                {
                    _id: update.productId,
                    "sizes._id": update.sizeId,
                },
                {
                    $inc: {
                        "sizes.$.stock": update.changeAmount,
                        "sizes.$.sellCount": -update.changeAmount, // Increase sell count
                        sellCount: -update.changeAmount,
                    },
                }
            );

            // ✅ Record stock history
            await StockHistory.create({
                productId: update.productId,
                orderId: orderId,
                sizeId: update.sizeId,
                sizeLabel: update.sizeLabel,
                oldStock: update.oldStock,
                newStock: update.newStock,
                changeAmount: update.changeAmount,
                action: "SALE", // Using SALE action (same as online orders)
                reason: `POS Order ${orderId}`,
                adminId: adminId,
            });

            console.log(
                `✅ Stock reduced: ${update.productName} (${update.sizeLabel}) - ${update.oldStock} → ${update.newStock}`
            );
        }

        return { success: true };
    } catch (error: any) {
        console.error("❌ Stock reduction failed:", error);
        return { success: false, errors: [error.message] };
    }
};

/**
 * 📍 POST /api/admin/pos
 * Create POS Order with Atomic Stock Reduction
 */
export const POST = async (req: NextRequest) => {
    try {
        const adminId = req.headers.get("x-admin-id");

        if (!adminId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized - Admin access required" },
                { status: 401 }
            );
        }

        // ✅ Verify admin exists
        const admin = await Admin.findById(adminId);
        if (!admin) {
            return NextResponse.json(
                { success: false, message: "Invalid admin" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { customerPhone, productDetails, paymentMethod, shippingCost = 0 } = body;

        console.log("📍 POS Order Request:", {
            customerPhone,
            productsCount: productDetails?.length,
            paymentMethod,
        });

        // ✅ Validate input
        if (!customerPhone || !productDetails || productDetails.length === 0 || !paymentMethod) {
            return NextResponse.json(
                { success: false, message: "Missing required fields" },
                { status: 400 }
            );
        }

        // ✅ Validate payment method
        const validPaymentMethods = ["CASH", "UPI", "CARD"];
        if (!validPaymentMethods.includes(paymentMethod)) {
            return NextResponse.json(
                { success: false, message: "Invalid payment method" },
                { status: 400 }
            );
        }

        // ✅ Validate phone number
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(customerPhone)) {
            return NextResponse.json(
                { success: false, message: "Invalid phone number format (10 digits required)" },
                { status: 400 }
            );
        }

        // ✅ Fetch products and calculate totals
        const productIds = productDetails.map((pd: any) => pd.product);
        const products = await Product.find({ _id: { $in: productIds } });

        if (products.length !== productIds.length) {
            return NextResponse.json(
                { success: false, message: "Some products not found" },
                { status: 404 }
            );
        }

        let totalActualPrice = 0;
        let totalOfferPrice = 0;
        const processedProductDetails: any[] = [];

        for (const pd of productDetails) {
            const product = products.find((p) => p._id.toString() === pd.product);
            if (!product) continue;

            const sizeObj = product.sizes?.find((s: any) => s._id.toString() === pd.sizeId);
            if (!sizeObj) {
                return NextResponse.json(
                    { success: false, message: `Size not found for product ${product.name}` },
                    { status: 400 }
                );
            }

            const quantity = pd.quantity || 1;

            // ✅ Check stock availability
            if (sizeObj.stock < quantity) {
                return NextResponse.json(
                    {
                        success: false,
                        message: `Product out of stock – cannot proceed with POS billing`,
                        product: product.name,
                        size: sizeObj.size,
                        available: sizeObj.stock,
                        requested: quantity,
                    },
                    { status: 400 }
                );
            }

            totalActualPrice += product.actualPrice * quantity;
            totalOfferPrice += (sizeObj.offerPrice || product.actualPrice) * quantity;

            processedProductDetails.push({
                product: product._id,
                count: quantity,
                size: {
                    _id: sizeObj._id,
                    size: sizeObj.size,
                },
                sizeId: sizeObj._id,
                sizeLabel: sizeObj.size,
                quantity: quantity,
            });
        }

        const totalPayablePrice = totalOfferPrice + shippingCost;

        // ✅ Generate invoice and order IDs
        const invoiceId = await generatePOSInvoiceNumber();
        const { orderId, orderSeq } = await generatePOSOrderId();

        console.log("📍 Generated IDs:", { invoiceId, orderId, orderSeq });

        // 🔥 CRITICAL: Create order FIRST, then reduce stock
        // This allows rollback if stock reduction fails
        const newOrder = new Order({
            orderId,
            orderSeq,
            invoiceId,
            order_type: "POS",
            productDetails: processedProductDetails,
            totalPrice: totalActualPrice,
            payablePrice: totalPayablePrice,
            off: totalActualPrice - totalOfferPrice,
            shippingCost,
            paymentMethod,
            paymentStatus: "PAYMENT_SUCCESS", // POS is always paid upfront
            currentStatus: "COMPLETED", // POS orders are immediately fulfilled
            paidAt: new Date(),
            shippingAddress: {
                mobile: customerPhone,
                name: "POS Customer",
            },
            stockUpdated: false, // Will update after stock reduction
            user: null, // POS orders don't require user account
            createdBy: adminId,
            metadata: {
                source: "POS",
                adminId,
                adminName: admin.name,
            },
        });

        await newOrder.save();
        console.log("✅ POS Order created (pending stock update):", orderId);

        // 🔥 CRITICAL: Reduce stock atomically
        const stockResult = await reduceStockForPOS(
            processedProductDetails,
            newOrder._id.toString(),
            adminId
        );

        if (!stockResult.success) {
            // ❌ ROLLBACK: Delete the order if stock reduction failed
            await Order.findByIdAndDelete(newOrder._id);
            console.error("❌ Stock reduction failed - Order rolled back:", orderId);

            return NextResponse.json(
                {
                    success: false,
                    message: "Stock reduction failed - Order cancelled",
                    errors: stockResult.errors,
                },
                { status: 400 }
            );
        }

        // ✅ Mark order as stock updated
        newOrder.stockUpdated = true;
        await newOrder.save();

        console.log("✅ POS Order completed successfully:", orderId);

        return NextResponse.json(
            {
                success: true,
                message: "POS order created successfully",
                order: {
                    orderId: newOrder.orderId,
                    invoiceId: newOrder.invoiceId,
                    totalPrice: totalActualPrice,
                    payablePrice: totalPayablePrice,
                    discount: totalActualPrice - totalOfferPrice,
                    paymentMethod,
                    customerPhone,
                    createdAt: newOrder.createdAt,
                },
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("❌ POS Order creation failed:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Internal server error",
                error: error.message,
            },
            { status: 500 }
        );
    }
};
