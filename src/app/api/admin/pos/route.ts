import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { connectDB } from "@/../db";
import Order from "@/model/Order";
import Product from "@/model/Product";
import Admin from "@/model/Admin";
import Razorpay from "razorpay";
import crypto from "crypto";
import { updateStock } from "@/lib/stockManager";
import { sendPOSInvoice } from "@/helper/whatsappNotifier";

// connectDB(); // Moved inside handler

// Razorpay instance created inside handler

/**
 * ✅ Generate unique POS invoice number
 * Format: POS-YYYYMMDD-0001
 */
const generatePOSInvoiceNumber = async (): Promise<string> => {
    try {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
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
            const parts = lastPOSOrder.invoiceId.split("-");
            if (parts.length === 3) {
                sequenceNumber = parseInt(parts[2]) + 1;
            }
        }

        return `POS-${dateStr}-${sequenceNumber.toString().padStart(4, "0")}`;
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
 * 📍 POST /api/admin/pos
 * Handles POS Order Creation, Payment Initiation, and Confirmation
 */
export const POST = async (req: NextRequest) => {
    try {
        await connectDB();
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || "",
            key_secret: process.env.RAZORPAY_KEY_SECRET || "",
        });
        const adminId = req.headers.get("x-admin-id");
        if (!adminId) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

        const admin = await Admin.findById(adminId);
        if (!admin) return NextResponse.json({ success: false, message: "Invalid admin" }, { status: 401 });

        const body = await req.json();
        const { action, customerPhone, productDetails, paymentMethod, transactionDetails, orderId, razorpayPaymentId, razorpaySignature, razorpayOrderId } = body;

        // ==========================================
        // 🔄 HANDLE PAYMENT CONFIRMATION
        // ==========================================
        if (action === "CONFIRM") {
            if (!orderId || !razorpayPaymentId || !razorpaySignature || !razorpayOrderId) {
                return NextResponse.json({ success: false, message: "Missing confirmation details" }, { status: 400 });
            }

            // Verify Signature
            const bodyStr = razorpayOrderId + "|" + razorpayPaymentId;
            const expectedSignature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
                .update(bodyStr.toString())
                .digest("hex");

            if (expectedSignature !== razorpaySignature) {
                return NextResponse.json({ success: false, message: "Invalid Payment Signature" }, { status: 400 });
            }

            const order = await Order.findOne({ orderId });
            if (!order) return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });

            if (order.paymentStatus === "PAYMENT_SUCCESS") {
                return NextResponse.json({ success: true, message: "Already confirmed", order });
            }

            // ✅ Deduct Stock
            const stockItems = order.productDetails.map((pd: any) => ({
                productId: pd.product.toString(),
                sizeId: pd.sizeId.toString(),
                quantity: pd.quantity,
                productName: pd.sizeLabel, // We stored basic info, might need to populate if strict logging needed
                sizeLabel: pd.sizeLabel
            }));

            const stockResult = await updateStock(stockItems, "SALE", "POS", order.orderId, adminId);

            if (!stockResult.success) {
                // Payment taken but stock failed! Critical
                // In a real system, we might need to refund or alert admin.
                console.error("CRITICAL: Payment confirmed but stock deduction failed", stockResult.errors);
                return NextResponse.json({ success: false, message: "Stock deduction failed after payment. Please contact support.", errors: stockResult.errors }, { status: 500 });
            }

            // Update Order
            order.paymentStatus = "PAYMENT_SUCCESS";
            order.currentStatus = "COMPLETED"; // POS orders fulfilled immediately
            order.stockUpdated = true;
            order.transactionId = razorpayPaymentId;
            order.metadata = { ...order.metadata, razorpayOrderId, razorpayPaymentId, razorpaySignature };
            await order.save();

            // Send Invoice
            try {
                const invoiceUrl = `https://www.swaarasya.com/invoice/${order.invoiceId}`;
                sendPOSInvoice("Customer", order.shippingAddress.mobile, order.orderId, invoiceUrl, admin.name || "S.I.S")
                    .catch(console.error);
            } catch (e) {
                console.error("WhatsApp Error:", e);
            }

            return NextResponse.json({ success: true, message: "Payment Confirmed", order });
        }

        // ==========================================
        // 🆕 CREATE ORDER (INITIATE / CASH / LINK)
        // ==========================================

        // 1. Validate Input
        if (!customerPhone || !productDetails || productDetails.length === 0) {
            return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
        }

        // 2. Fetch Products & Calculate Totals
        const productIds = productDetails.map((pd: any) => pd.product);
        const products = await Product.find({ _id: { $in: productIds } }).populate("categories");

        let totalActualPrice = 0, totalOfferPrice = 0, totalGstAmount = 0;
        const processedProductDetails: any[] = [], taxDetails: any[] = [];
        const stockCheckItems: any[] = [];

        for (const pd of productDetails) {
            const product = products.find((p) => p._id.toString() === pd.product);
            if (!product) continue;

            const sizeObj = product.sizes?.find((s: any) => s._id.toString() === pd.sizeId);
            if (!sizeObj) return NextResponse.json({ success: false, message: `Size not found for ${product.name}` }, { status: 400 });

            if (sizeObj.stock < pd.quantity) {
                return NextResponse.json({
                    success: false,
                    message: `Insufficient stock for ${product.name} (${sizeObj.size}). Avail: ${sizeObj.stock}`
                }, { status: 400 });
            }

            const itemPrice = sizeObj.offerPrice || product.actualPrice;
            totalActualPrice += product.actualPrice * pd.quantity;
            totalOfferPrice += itemPrice * pd.quantity;

            let productGstPercent = 0;
            if (product.categories?.length > 0) {
                productGstPercent = Math.max(...product.categories.map((c: any) => c.gst || 0));
            }
            const itemTax = (itemPrice * productGstPercent / 100) * pd.quantity;
            totalGstAmount += itemTax;

            taxDetails.push({
                productId: product._id, name: product.name, gstPercent: productGstPercent,
                gstAmount: itemTax, price: itemPrice, quantity: pd.quantity
            });

            processedProductDetails.push({
                product: product._id, count: pd.quantity, quantity: pd.quantity,
                size: { _id: sizeObj._id, size: sizeObj.size },
                sizeId: sizeObj._id, sizeLabel: sizeObj.size
            });

            stockCheckItems.push({
                productId: product._id.toString(),
                sizeId: sizeObj._id.toString(),
                quantity: pd.quantity,
                productName: product.name,
                sizeLabel: sizeObj.size
            });
        }

        const totalPayablePrice = totalOfferPrice + totalGstAmount;
        const invoiceId = await generatePOSInvoiceNumber();
        const { orderId: newOrderId, orderSeq } = await generatePOSOrderId();

        // 3. Create Order Object
        const newOrder = new Order({
            orderId: newOrderId,
            orderSeq,
            invoiceId,
            order_type: "POS",
            productDetails: processedProductDetails,
            totalPrice: totalActualPrice,
            payablePrice: totalPayablePrice,
            off: totalActualPrice - totalOfferPrice,
            shippingCost: 0,
            paymentMethod,
            // If CASH, success immediately. If razorpay, PENDING.
            paymentStatus: paymentMethod === "CASH" ? "PAYMENT_SUCCESS" : "PENDING",
            currentStatus: paymentMethod === "CASH" ? "COMPLETED" : "PENDING",
            paidAt: paymentMethod === "CASH" ? new Date() : null,
            transactionId: transactionDetails || undefined,
            shippingAddress: { mobile: customerPhone, name: "POS Customer", address: "" },
            stockUpdated: false,
            user: null,
            createdBy: adminId,
            metadata: {
                source: "POS", adminId, adminName: admin.name,
                transactionDetails: transactionDetails || null, taxDetails, totalGstAmount
            },
        });

        // 4. Handle Specific Actions
        if (action === "INITIATE") {
            // Create Razorpay Order
            const rzpOrder = await razorpay.orders.create({
                amount: Math.round(totalPayablePrice * 100), // paise
                currency: "INR",
                receipt: newOrderId,
                notes: { orderId: newOrderId }
            });

            newOrder.metadata.razorpayOrderId = rzpOrder.id;
            await newOrder.save();
            // Note: We DO NOT deduct stock yet. Stock is checked, but deducted on CONFIRM.

            return NextResponse.json({
                success: true,
                orderId: newOrderId,
                razorpayOrderId: rzpOrder.id,
                amount: rzpOrder.amount,
                currency: rzpOrder.currency,
                keyId: process.env.RAZORPAY_KEY_ID
            });

        } else if (action === "GenerateLink") {
            const linkOptions = {
                amount: Math.round(totalPayablePrice * 100),
                currency: "INR",
                accept_partial: false,
                description: `Swaarasya Order #${newOrderId}`,
                customer: { contact: customerPhone },
                notify: { sms: true, email: false }, // Notify customer via SMS (if supported)
                reminder_enable: true,
                notes: { orderId: newOrderId },
                callback_url: "https://www.swaarasya.com/payment-success", // Fallback
                callback_method: "get"
            };

            const paymentLink = await razorpay.paymentLink.create(linkOptions);

            newOrder.metadata.paymentLinkId = paymentLink.id;
            newOrder.metadata.paymentLinkUrl = paymentLink.short_url;
            await newOrder.save();

            return NextResponse.json({
                success: true,
                message: "Payment Link Generated",
                paymentLink: paymentLink.short_url,
                order: newOrder
            });

        } else {
            // Default: CASH or normal
            await newOrder.save();

            // Deduct Stock Immediately
            const stockResult = await updateStock(stockCheckItems, "SALE", "POS", newOrderId, adminId);

            if (!stockResult.success) {
                await Order.findByIdAndDelete(newOrder._id); // Rollback
                return NextResponse.json({ success: false, message: "Stock deduction failed", errors: stockResult.errors }, { status: 400 });
            }

            newOrder.stockUpdated = true;
            await newOrder.save();

            try {
                const invoiceUrl = `https://www.swaarasya.com/invoice/${newOrder.invoiceId}`;
                sendPOSInvoice("Customer", customerPhone, newOrder.orderId, invoiceUrl, admin.name || "S.I.S").catch(console.error);
            } catch (e) { console.error(e) }

            return NextResponse.json({ success: true, message: "POS Order Created", order: newOrder }, { status: 201 });
        }

    } catch (error: any) {
        console.error("POS Error:", error);
        return NextResponse.json({ success: false, message: error.message || "Internal Error" }, { status: 500 });
    }
};
