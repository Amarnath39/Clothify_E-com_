
import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { connectDB } from "../../../../../db"; // Relative path for safety
import Order from "../../../../../src/model/Order"; // Relative path
import Product from "../../../../../src/model/Product"; // Relative path
import Admin from "../../../../../src/model/Admin"; // Relative path
import Razorpay from "razorpay";
import { updateStock } from "../../../../../src/lib/stockManager"; // Relative path
import { sendPOSInvoice } from "../../../../../src/helper/whatsappNotifier"; // Relative path
import Counter from "../../../../../src/model/Counter"; // Relative path

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
        const counter = await Counter.findOneAndUpdate(
            { id: "posOrderSeq" },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );

        // Start POS sequence from 1000 if new
        if (counter.seq < 1000) {
            const initialCounter = await Counter.findOneAndUpdate(
                { id: "posOrderSeq" },
                { $set: { seq: 1000 } },
                { new: true, upsert: true }
            );
            return {
                orderId: `POS-${initialCounter.seq.toString().padStart(6, "0")}`,
                orderSeq: initialCounter.seq,
            };
        }

        return {
            orderId: `POS-${counter.seq.toString().padStart(6, "0")}`,
            orderSeq: counter.seq,
        };
    } catch (error) {
        console.error("Error generating POS order ID:", error);
        throw error;
    }
};

/**
 * 📍 POST /api/admin/pos
 * Handles POS Order Creation (Immediate & Link)
 * Re-Architected for Stability & Zero 500 Errors
 */
export const POST = async (req: NextRequest) => {
    try {
        // 1. Safe DB Connection
        await connectDB();

        // 2. Validate Admin Access
        const adminId = req.headers.get("x-admin-id");
        if (!adminId) {
            return NextResponse.json({ success: false, message: "Unauthorized: Missing Admin ID" }, { status: 401 });
        }

        let admin;
        try {
            admin = await Admin.findById(adminId);
            if (!admin) throw new Error("Admin not found in DB");
        } catch (e) {
            return NextResponse.json({ success: false, message: "Invalid Admin Credentials" }, { status: 401 });
        }

        // 3. Parse & Validate Body
        let body;
        try {
            body = await req.json();
        } catch (e) {
            return NextResponse.json({ success: false, message: "Invalid JSON Body" }, { status: 400 });
        }

        const { action, customerPhone, productDetails, paymentMethod, transactionDetails } = body;

        // Enhanced validation with detailed error messages
        console.log("📦 POS Request Body:", JSON.stringify({
            action,
            customerPhone,
            productDetailsCount: productDetails?.length || 0,
            paymentMethod,
            hasTransactionDetails: !!transactionDetails
        }, null, 2));

        if (!customerPhone) {
            console.error("❌ Missing customerPhone");
            return NextResponse.json({ success: false, message: "Missing customer phone number" }, { status: 400 });
        }

        if (!productDetails || !Array.isArray(productDetails)) {
            console.error("❌ Invalid productDetails:", productDetails);
            return NextResponse.json({ success: false, message: "Product details must be an array" }, { status: 400 });
        }

        if (productDetails.length === 0) {
            console.error("❌ Empty productDetails array");
            return NextResponse.json({ success: false, message: "Cart is empty" }, { status: 400 });
        }

        if (!paymentMethod) {
            console.error("❌ Missing payment method");
            return NextResponse.json({ success: false, message: "Payment method is required" }, { status: 400 });
        }

        // Validate product details structure
        for (let i = 0; i < productDetails.length; i++) {
            const pd = productDetails[i];
            if (!pd.product) {
                console.error(`❌ Missing product ID at index ${i}:`, pd);
                return NextResponse.json({ success: false, message: `Invalid product at position ${i + 1}` }, { status: 400 });
            }
            if (!pd.sizeId) {
                console.error(`❌ Missing sizeId at index ${i}:`, pd);
                return NextResponse.json({ success: false, message: `Missing size for product at position ${i + 1}` }, { status: 400 });
            }
            if (!pd.quantity || pd.quantity < 1) {
                console.error(`❌ Invalid quantity at index ${i}:`, pd);
                return NextResponse.json({ success: false, message: `Invalid quantity for product at position ${i + 1}` }, { status: 400 });
            }
        }

        console.log("✅ Request validation passed");


        // 4. Fetch Products & Calculate Totals (Safe Mode)
        const productIds = productDetails.map((pd: any) => pd.product);
        const products = await Product.find({ _id: { $in: productIds } }).populate("categories");

        let totalActualPrice = 0, totalOfferPrice = 0, totalGstAmount = 0;
        const processedProductDetails: any[] = [];
        const taxDetails: any[] = [];
        const stockCheckItems: any[] = [];

        for (const pd of productDetails) {
            const product = products.find((p) => p._id.toString() === pd.product);
            if (!product) {
                return NextResponse.json({ success: false, message: `Product not found (ID: ${pd.product})` }, { status: 400 });
            }

            const sizeObj = product.sizes?.find((s: any) => s._id.toString() === pd.sizeId);
            if (!sizeObj) {
                return NextResponse.json({ success: false, message: `Size not found for ${product.name}` }, { status: 400 });
            }

            // Strict Stock Check
            if (sizeObj.stock < pd.quantity) {
                return NextResponse.json({
                    success: false,
                    message: `Insufficient stock for ${product.name} (${sizeObj.size}). Available: ${sizeObj.stock}`
                }, { status: 400 });
            }

            const itemPrice = sizeObj.offerPrice || product.actualPrice;
            totalActualPrice += product.actualPrice * pd.quantity;
            totalOfferPrice += itemPrice * pd.quantity;

            // Calculate GST
            let productGstPercent = 0;
            if (product.categories && Array.isArray(product.categories) && product.categories.length > 0) {
                // Handle potential object/string structure in categories
                productGstPercent = Math.max(...product.categories.map((c: any) => (typeof c === 'object' ? (c.gst || 0) : 0)));
            }
            const itemTax = (itemPrice * productGstPercent / 100) * pd.quantity;
            totalGstAmount += itemTax;

            taxDetails.push({
                productId: product._id,
                name: product.name,
                gstPercent: productGstPercent,
                gstAmount: itemTax,
                price: itemPrice,
                quantity: pd.quantity
            });

            processedProductDetails.push({
                product: product._id,
                count: pd.quantity,
                quantity: pd.quantity,
                size: { _id: sizeObj._id, size: sizeObj.size },
                sizeId: sizeObj._id,
                sizeLabel: sizeObj.size
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

        // 5. Generate Identifiers
        const invoiceId = await generatePOSInvoiceNumber();
        const { orderId: newOrderId, orderSeq } = await generatePOSOrderId();

        // 6. Determine Status based on Payment Method
        // Rules:
        // - CASH / UPI / CARD (Manual) -> PAYMENT_SUCCESS & COMPLETED
        // - LINK -> PENDING & PENDING

        const isImmediatePayment =
            paymentMethod === "CASH" ||
            paymentMethod === "UPI" ||
            paymentMethod === "CARD" ||
            action === "COMPLETE"; // Explicit override

        const paymentStatus = isImmediatePayment ? "PAYMENT_SUCCESS" : "PAYMENT_PENDING";
        const currentStatus = isImmediatePayment ? "COMPLETED" : "PENDING";
        const paidAt = isImmediatePayment ? new Date() : null;

        // 7. Create Order Object
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
            paymentStatus,
            currentStatus,
            paidAt,
            transactionId: transactionDetails || undefined,
            shippingAddress: {
                mobile: customerPhone,
                name: "POS Customer",
                address: "Store Pickup"
            },
            stockUpdated: false, // Will be set to true if immediate
            user: null,
            createdBy: adminId,
            metadata: {
                source: "POS",
                adminId,
                adminName: admin.name,
                transactionDetails: transactionDetails || null,
                taxDetails,
                totalGstAmount,
                notes: { orderId: newOrderId, invoiceId } // For Webhook recovery
            },
        });

        // ==========================================
        // 🚀 ACTION: GENERATE LINK
        // ==========================================
        if (action === "GenerateLink") {
            // Verify Razorpay Env
            if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
                return NextResponse.json({ success: false, message: "Razorpay keys not configured on server" }, { status: 500 });
            }

            try {
                const razorpay = new Razorpay({
                    key_id: process.env.RAZORPAY_KEY_ID,
                    key_secret: process.env.RAZORPAY_KEY_SECRET,
                });
                // Sanitize Phone Number (Ensure E.164 format)
                let contact = customerPhone.trim();
                if (contact.length === 10 && !contact.startsWith("+")) {
                    contact = `+91${contact}`;
                }

                const linkOptions = {
                    amount: Math.round(totalPayablePrice * 100), // paise
                    currency: "INR",
                    accept_partial: false,
                    // Append random suffix to ensure uniqueness on retries
                    reference_id: `${newOrderId}-${Math.random().toString(36).substring(2, 7)}`,
                    description: `Swaarasya POS Order #${newOrderId}`,
                    customer: { contact: contact, name: "POS Customer" },
                    notify: { sms: true, email: false }, // SMS enabled
                    reminder_enable: true,
                    notes: { orderId: newOrderId, invoiceId, orderType: "POS" },
                    callback_url: `https://www.swaarasya.com/invoice/${invoiceId}`,
                    callback_method: "get"
                };

                console.log("Generating Razorpay Link...", JSON.stringify(linkOptions));

                const paymentLink = await razorpay.paymentLink.create(linkOptions);

                newOrder.metadata.paymentLinkId = paymentLink.id;
                newOrder.metadata.paymentLinkUrl = paymentLink.short_url;
                newOrder.metadata.paymentLinkStatus = "created";

                await newOrder.save();

                // NO STOCK DEDUCTION YET (Wait for Webhook)

                return NextResponse.json({
                    success: true,
                    message: "Payment Link Generated",
                    paymentLink: paymentLink.short_url,
                    paymentLinkId: paymentLink.id,
                    invoiceId: invoiceId,
                    order: newOrder
                });

            } catch (rzpError: any) {
                console.error("Razorpay Link Creation Failed:", rzpError);
                return NextResponse.json({
                    success: false,
                    message: "Razorpay API Failed",
                    error: rzpError.error?.description || rzpError.message || "Unknown Razorpay Error"
                }, { status: 502 });
            }
        }

        // ==========================================
        // 🚀 ACTION: GENERATE QR CODE
        // ==========================================
        else if (action === "GenerateQR") {
            // Verify Razorpay Env
            if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
                return NextResponse.json({ success: false, message: "Razorpay keys not configured on server" }, { status: 500 });
            }

            try {
                const razorpay = new Razorpay({
                    key_id: process.env.RAZORPAY_KEY_ID,
                    key_secret: process.env.RAZORPAY_KEY_SECRET,
                });

                const qrOptions = {
                    type: "upi_qr",
                    usage: "single_use",
                    fixed_amount: true,
                    payment_amount: Math.round(totalPayablePrice * 100), // paise
                    description: `Swaarasya POS Order #${newOrderId}`,
                    customer_id: undefined, // Optional
                    notes: { orderId: newOrderId, invoiceId, orderType: "POS" },
                };

                console.log("Generating Razorpay Dynamic QR...", JSON.stringify(qrOptions));

                const qrCode = await (razorpay as any).qrCode.create(qrOptions);

                newOrder.metadata.qrCodeId = qrCode.id;
                newOrder.metadata.qrCodeImageUrl = (qrCode as any).image_url; // Razorpay SDK typings might be missing this
                newOrder.metadata.qrCodeStatus = qrCode.status;
                newOrder.paymentMethod = "RAZORPAY_QR";

                await newOrder.save();

                return NextResponse.json({
                    success: true,
                    message: "QR Code Generated",
                    qrCode: (qrCode as any).image_url,
                    qrCodeId: qrCode.id,
                    orderId: newOrderId,
                    invoiceId: invoiceId,
                    order: newOrder
                });

            } catch (rzpError: any) {
                console.error("Razorpay QR Creation Failed:", rzpError);
                return NextResponse.json({
                    success: false,
                    message: "Razorpay API Failed (QR)",
                    error: rzpError.error?.description || rzpError.message || "Unknown Razorpay Error"
                }, { status: 502 });
            }
        }

        // ==========================================
        // 🚀 ACTION: COMPLETE (Immediate Payment)
        // ==========================================
        else if (action === "COMPLETE" || isImmediatePayment) {
            console.log("💰 Processing immediate payment order:", {
                orderId: newOrderId,
                paymentMethod,
                totalItems: stockCheckItems.length
            });

            await newOrder.save();
            console.log("✅ Order saved to database");

            // Deduct Stock Immediately
            console.log("📦 Attempting stock deduction for items:", JSON.stringify(stockCheckItems, null, 2));

            const stockResult = await updateStock(stockCheckItems, "SALE", "POS", newOrder._id.toString(), adminId);

            if (!stockResult.success) {
                console.error("❌ Stock deduction failed:", stockResult.errors);

                // Rollback Order
                console.log("🔄 Rolling back order...");
                await Order.findByIdAndDelete(newOrder._id);
                console.log("✅ Order rollback complete");

                return NextResponse.json({
                    success: false,
                    message: "Stock deduction failed",
                    errors: stockResult.errors
                }, { status: 400 });
            }

            console.log("✅ Stock deduction successful");

            newOrder.stockUpdated = true;
            await newOrder.save();

            // Async Invoice Sending
            try {
                const invoiceUrl = `https://www.swaarasya.com/invoice/${newOrder.invoiceId}`;
                sendPOSInvoice("Customer", customerPhone, newOrder.orderId, invoiceUrl, admin.name || "S.I.S").catch(console.error);
            } catch (e) { console.error("Invoice Send Error:", e) }

            return NextResponse.json({
                success: true,
                message: "POS Order Completed",
                order: newOrder,
                invoiceId: newOrder.invoiceId
            }, { status: 201 });
        }

        // ==========================================
        // ⚠️ UNKNOWN ACTION
        // ==========================================
        else {
            return NextResponse.json({ success: false, message: "Invalid Action or Flow" }, { status: 400 });
        }

    } catch (error: any) {
        console.error("❌ CRITICAL POS ERROR:", error);
        return NextResponse.json({
            success: false,
            message: "Internal Server Error in POS System",
            error: error?.message || "Unknown Error",
            stack: error?.stack // helpful for debug
        }, { status: 500 }); // We use 500 but handled gracefully
    }
};
