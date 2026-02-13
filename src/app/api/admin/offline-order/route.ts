import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../db";
import Order from "../../../../model/Order";
import Product from "../../../../model/Product";
import Coupon from "../../../../model/Coupon";
import { sendOrderConfirmation } from "../../../../helper/whatsappNotifier";
import { sendOfflineOrderEmail } from "../../../../helper/sendOfflineOrderEmail";
import { updateStock } from "../../../../../src/lib/stockManager";
import Counter from "../../../../model/Counter";
import mongoose from "mongoose";
import axios from "axios";
import { generateRandomId } from "../../../../helper/generateRandomId";
import Razorpay from "razorpay";
import Category from "../../../../model/Category";

connectDB();

// ✅ Generate unique Offline Order ID
const generateOfflineOrderId = async (): Promise<string> => {
    try {
        const counter = await Counter.findOneAndUpdate(
            { id: "offlineOrderSeq" },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );

        // Start offline sequence from 1000 if new
        if (counter.seq < 1000) {
            const initialCounter = await Counter.findOneAndUpdate(
                { id: "offlineOrderSeq" },
                { $set: { seq: 1000 } },
                { new: true, upsert: true }
            );
            return `OFF-${initialCounter.seq.toString().padStart(6, "0")}`;
        }

        return `OFF-${counter.seq.toString().padStart(6, "0")}`;
    } catch (error) {
        console.error("Error generating offline order ID:", error);
        throw error;
    }
};

/**
 * ✅ Generate unique Offline invoice number
 * Format: OFF-INV-YYYYMMDD-0001
 */
const generateOfflineInvoiceNumber = async (): Promise<string> => {
    try {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
        const todayStart = new Date(today.setHours(0, 0, 0, 0));
        const todayEnd = new Date(today.setHours(23, 59, 59, 999));

        const lastOfflineOrder = await Order.findOne({
            order_type: "OFFLINE",
            createdAt: { $gte: todayStart, $lte: todayEnd },
        })
            .sort({ createdAt: -1 })
            .select("invoiceId")
            .lean() as { invoiceId: string } | null;

        let sequenceNumber = 1;

        if (lastOfflineOrder?.invoiceId) {
            const parts = lastOfflineOrder.invoiceId.split("-");
            // OFF-INV-YYYYMMDD-XXXX -> parts are 4
            if (parts.length === 4) {
                sequenceNumber = parseInt(parts[3]) + 1;
            }
        }

        return `OFF-INV-${dateStr}-${sequenceNumber.toString().padStart(4, "0")}`;
    } catch (error) {
        console.error("Error generating offline invoice number:", error);
        throw error;
    }
};

export const POST = async (req: NextRequest) => {
    try {
        // ✅ Check feature flag
        if (process.env.NEXT_PUBLIC_ENABLE_ADMIN_OFFLINE_ORDERS !== "true") {
            return NextResponse.json(
                { success: false, msg: "Feature not enabled" },
                { status: 403 }
            );
        }

        // ✅ Verify admin authentication and valid ObjectId
        const adminId = req.headers.get("x-admin-id");
        if (!adminId || adminId === "null" || adminId === "undefined" || !mongoose.isValidObjectId(adminId)) {
            console.error("❌ Invalid Admin ID provided:", adminId);
            return NextResponse.json(
                { success: false, msg: "Valid Admin authentication required" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const {
            customerDetails,
            productDetails,
            couponCode,
            paymentMode,
            paymentStatus,
            shippingMethod,
            dtdcDetails,
            manualShipping,
            sendEmail = true,
            sendWhatsApp = true,
        } = body;

        // ✅ Validate input
        if (
            !customerDetails ||
            !customerDetails.name ||
            !customerDetails.phone ||
            !customerDetails.billingAddress ||
            !customerDetails.shippingAddress ||
            !productDetails ||
            !Array.isArray(productDetails) ||
            productDetails.length === 0 ||
            !paymentMode ||
            !paymentStatus ||
            !shippingMethod
        ) {
            return NextResponse.json(
                { success: false, msg: "Invalid input - missing required fields" },
                { status: 400 }
            );
        }

        // ✅ Validate products and calculate prices (reuse existing logic)
        const uniqueProductIds = [
            ...new Set(productDetails.map((pd) => pd.product)),
        ];

        const products = await Product.find({ _id: { $in: uniqueProductIds } }).populate("categories");

        if (products.length !== uniqueProductIds.length) {
            return NextResponse.json(
                { success: false, msg: "Some products not found" },
                { status: 404 }
            );
        }

        let totalActualPrice = 0;
        let totalOfferPrice = 0;
        let totalGstAmount = 0;
        const taxDetails: any[] = [];
        const outOfStockProducts: string[] = [];

        const processedProductDetails = productDetails
            .map((pd) => {
                const product = products.find((p) => p._id.toString() === pd.product);
                if (product) {
                    const quantity = pd.count || 1;
                    const selectedSize = pd.size;

                    const sizeObj = product.sizes.find(
                        (size: any) => size._id.toString() === selectedSize
                    );

                    if (!sizeObj || sizeObj.stock < quantity) {
                        outOfStockProducts.push(product._id.toString());
                        return null;
                    } else {
                        const itemPrice = sizeObj.offerPrice || product.actualPrice;
                        totalActualPrice += product.actualPrice * quantity;
                        totalOfferPrice += itemPrice * quantity;

                        // GST Calculation (Inclusive)
                        let productGstPercent = 0;
                        if (product.categories && Array.isArray(product.categories)) {
                            // Safely handle both populated and unpopulated categories if needed, though we populated it above
                            productGstPercent = Math.max(0, ...product.categories.map((c: any) => (typeof c === 'object' ? (c.gst || 0) : 0)));
                        }

                        const itemTaxableValue = (itemPrice * 100) / (100 + productGstPercent);
                        const itemGstAmount = (itemPrice - itemTaxableValue) * quantity;
                        totalGstAmount += itemGstAmount;

                        taxDetails.push({
                            productId: product._id,
                            name: product.name,
                            gstPercent: productGstPercent,
                            gstAmount: itemGstAmount,
                            price: itemPrice, // Total inclusive price
                            quantity: quantity
                        });

                        return {
                            product: product._id,
                            count: quantity,
                            size: {
                                _id: sizeObj._id,
                                size: sizeObj.size
                            },
                            sizeLabel: sizeObj.size,
                            actualPrice: product.actualPrice,
                            offerPrice: itemPrice,
                        };
                    }
                }
                return null;
            })
            .filter((pd) => pd !== null);

        if (outOfStockProducts.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    msg: "Some products are out of stock",
                    outOfStockProducts,
                },
                { status: 400 }
            );
        }

        // Prepare items for stock update utility
        const stockUpdateItems = processedProductDetails.map(item => ({
            productId: item.product.toString(),
            sizeId: item.size._id.toString(),
            quantity: item.count,
            productName: products.find(p => p._id.toString() === item.product.toString())?.name
        }));

        // ✅ Apply coupon (optional, reuse existing logic)
        let discount = 0;
        if (couponCode) {
            const coupon = await Coupon.findOne({ couponCode });
            if (coupon) {
                const isValid =
                    coupon.validity &&
                    new Date(coupon.validity) > new Date() &&
                    coupon.availableFor > coupon.userCount &&
                    coupon.purchaseAmount <= totalOfferPrice;

                if (isValid) {
                    if (coupon.type === "percentage") {
                        discount = (totalOfferPrice * coupon.off) / 100;
                        discount = Math.min(discount, coupon.amount);
                    } else if (coupon.type === "flat") {
                        discount = coupon.off;
                        discount = Math.min(discount, coupon.amount);
                    }
                    discount = Math.max(discount, 1);

                    coupon.userCount += 1;
                    await coupon.save();
                }
            }
        }

        // ✅ Calculate shipping cost (can be 0 for manual shipping)
        const shippingCost = body.shippingCost || 0;

        // ✅ Calculate final payable price
        let totalPayablePrice = totalOfferPrice - discount + shippingCost;
        totalPayablePrice = Math.max(totalPayablePrice, 1);

        // ✅ Create order
        const isRazorpayLink = paymentMode === "RAZORPAY_LINK";
        const initialPaymentStatus = isRazorpayLink ? "PAYMENT_PENDING" : (paymentStatus === "Paid" ? "PAYMENT_SUCCESS" : "NOT_INITIATED");
        const initialCurrentStatus = isRazorpayLink ? "PENDING" : (paymentStatus === "Paid" ? "COMPLETED" : "PENDING");

        // ✅ 3. Generate Order ID and Invoice ID
        const orderId = await generateOfflineOrderId();
        const invoiceId = await generateOfflineInvoiceNumber();

        // ✅ 4. Create Order Object
        const newOrder = new Order({
            orderId,
            invoiceId,
            order_type: "OFFLINE",
            productDetails: processedProductDetails,
            totalPrice: totalActualPrice,
            payablePrice: totalPayablePrice,
            off: discount,
            shippingAddress: customerDetails.shippingAddress,
            shippingCost,
            paymentMethod: paymentMode,
            paymentStatus: initialPaymentStatus,
            currentStatus: initialCurrentStatus,
            date: new Date(),
            paidAt: paymentStatus === "Paid" && !isRazorpayLink ? new Date() : null,

            // ✅ MARK AS OFFLINE
            // order_type: "OFFLINE", // Removed duplicate
            orderSource: "ADMIN_OFFLINE",
            createdBy: adminId,

            // ✅ Set shipping details based on method
            deliveryPartner:
                shippingMethod === "DTDC" ? "DTDC" : manualShipping?.courierName || "MANUAL",
            trackingId: manualShipping?.trackingNumber || "",

            // Metadata for recovery and GST display
            metadata: {
                source: "OFFLINE_ADMIN",
                adminId,
                taxDetails,
                totalGstAmount,
                totalSgstAmount: totalGstAmount / 2,
                totalCgstAmount: totalGstAmount / 2,
            }
        });

        await newOrder.save();

        let paymentLinkData: { id: string; url: string; status: string } | null = null;

        // 🚀 ACTION: GENERATE RAZORPAY LINK
        if (isRazorpayLink) {
            if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
                // Don't fail order, just warn
                console.error("❌ Razorpay keys missing");
            } else {
                try {
                    const razorpay = new Razorpay({
                        key_id: process.env.RAZORPAY_KEY_ID,
                        key_secret: process.env.RAZORPAY_KEY_SECRET,
                    });

                    let contact = customerDetails.phone.trim();
                    if (contact.length === 10 && !contact.startsWith("+")) {
                        contact = `+91${contact}`;
                    }

                    const linkOptions = {
                        amount: Math.round(totalPayablePrice * 100),
                        currency: "INR",
                        accept_partial: false,
                        reference_id: `${orderId}-${Math.random().toString(36).substring(2, 7)}`,
                        description: `Swaarasya Offline Order #${orderId}`,
                        customer: { contact: contact, name: customerDetails.name },
                        notify: { sms: true, email: !!customerDetails.email },
                        reminder_enable: true,
                        notes: { orderId: orderId, invoiceId, orderType: "OFFLINE" },
                        callback_url: `https://www.swaarasya.com/invoice/${invoiceId}`, // Fallback
                    };

                    const link = await razorpay.paymentLink.create(linkOptions);
                    paymentLinkData = {
                        id: link.id,
                        url: link.short_url,
                        status: link.status
                    };

                    // Update order with link details
                    newOrder.metadata = { ...newOrder.metadata, paymentLink: paymentLinkData };
                    await newOrder.save();

                } catch (err) {
                    console.error("❌ Failed to generate Razorpay link:", err);
                    // We still return success but without link? Or should we error? 
                    // Better to warn user.
                }
            }
        }

        // ✅ Reduce inventory via centralized utility (ONLY IF PAID IMMEDIATELY)
        // For Razorpay Link, stock is deducted via Webhook on success
        if (initialPaymentStatus === "PAYMENT_SUCCESS") {
            const stockResult = await updateStock(
                stockUpdateItems as any,
                "SALE",
                "OFFLINE",
                newOrder._id.toString(),
                adminId
            );

            if (!stockResult.success) {
                // Rollback Order if stock deduction fails
                await Order.findByIdAndDelete(newOrder._id);
                return NextResponse.json(
                    { success: false, msg: "Stock deduction failed", errors: stockResult.errors },
                    { status: 400 }
                );
            }
        }

        // ✅ DTDC Integration (conditional - only when payment is completed)
        if (shippingMethod === "DTDC" && dtdcDetails && initialPaymentStatus === "PAYMENT_SUCCESS") {
            try {

                const consignments = processedProductDetails.map((item: any) => {
                    const customerRef = generateRandomId(15);

                    return {
                        customer_code: process.env.DTDC_CUSTOMER_CODE || "OO3772",
                        service_type_id: "STD EXP-A",
                        load_type: "NON-DOCUMENT",
                        consignment_type: "Forward",
                        description: "Clothes Shipment",
                        dimension_unit: "cm",
                        length: dtdcDetails.length || "1",
                        width: dtdcDetails.breadth || "1",
                        height: dtdcDetails.height || "1",
                        weight_unit: "kg",
                        weight: dtdcDetails.weight || (item.count * 0.25).toString(),
                        declared_value: totalPayablePrice.toString(),
                        num_pieces: item.count.toString(),

                        origin_details: {
                            name: process.env.DTDC_ORIGIN_NAME || "Swaarasya",
                            phone: process.env.DTDC_ORIGIN_PHONE || "6282 025 003",
                            address_line_1: process.env.DTDC_ORIGIN_ADDR1 || "PERUKAVU ",
                            address_line_2: process.env.DTDC_ORIGIN_ADDR2 || "VILAVOORKAL , MALAYINKEEZHU,",
                            pincode: dtdcDetails.pickupPincode || process.env.DTDC_ORIGIN_PINCODE || "695573",
                            city: process.env.DTDC_ORIGIN_CITY || "THIRUVANANTHAPURAM",
                            state: process.env.DTDC_ORIGIN_STATE || "KERALA",
                        },

                        destination_details: {
                            name: customerDetails.shippingAddress.name.toUpperCase(),
                            phone: customerDetails.phone,
                            address_line_1:
                                customerDetails.shippingAddress.address.toUpperCase() || "NA",
                            address_line_2:
                                customerDetails.shippingAddress.address.toUpperCase() || "",
                            pincode:
                                customerDetails.shippingAddress.zipCode ||
                                dtdcDetails.deliveryPincode ||
                                "000000",
                            city: customerDetails.shippingAddress.city || "NA",
                            state:
                                customerDetails.shippingAddress.state.toUpperCase() || "NA",
                        },

                        customer_reference_number: customerRef.toString(),
                        cod_amount: "",
                        cod_collection_mode: "",
                        commodity_id: "99",
                        eway_bill: "",
                        is_risk_surcharge_applicable: false,
                        invoice_number: customerRef.toString(),
                        invoice_date: new Date().toISOString(),
                        reference_number: "",
                    };
                });

                const payload = { consignments };

                const dtdcRes = await axios.post(
                    "https://dtdcapi.shipsy.io/api/customer/integration/consignment/softdata",
                    payload,
                    {
                        headers: {
                            accept: "application/json",
                            "Content-Type": "application/json",
                            "api-key": process.env.DTDC_API_KEY || "52256c0d05c94bda4c897dce29a485",
                        },
                    }
                );

                if (dtdcRes.data?.data?.[0]?.success) {
                    await Order.findByIdAndUpdate(
                        newOrder._id,
                        {
                            $set: {
                                dtdc: {
                                    referenceNumber: dtdcRes.data.data[0].reference_number,
                                    customerReferenceNumber:
                                        dtdcRes.data.data[0].customer_reference_number,
                                },
                            },
                        },
                        { new: true }
                    );
                } else {
                    console.warn("DTDC integration failed:", dtdcRes.data);
                }
            } catch (dtdcErr) {
                console.error("DTDC API Error:", dtdcErr);
                // Don't fail the order creation
            }
        }

        // ✅ Prepare plain order object for notifications
        const orderForNotification = {
            orderId: newOrder.orderId,
            productDetails: processedProductDetails,
            totalPrice: newOrder.totalPrice,
            payablePrice: newOrder.payablePrice,
            off: newOrder.off,
            shippingCost: newOrder.shippingCost,
            paymentMethod: newOrder.paymentMethod,
            paymentStatus: newOrder.paymentStatus,
            currentStatus: newOrder.currentStatus,
            trackingId: newOrder.trackingId,
        };

        // ✅ Send Email (if enabled and email provided)
        // Send only if confirm immediately or if we want to send "Order Created" email even for pending payment
        // Usually we send email on creation.
        if (sendEmail && customerDetails.email) {
            console.log(`📧 Attempting to send offline order email to ${customerDetails.email}...`);
            try {
                const emailResult = await sendOfflineOrderEmail({
                    customerEmail: customerDetails.email,
                    customerName: customerDetails.name,
                    orderId: newOrder.orderId,
                    orderDetails: orderForNotification,
                    paymentMode,
                    paymentStatus: initialPaymentStatus,
                    shippingMethod,
                    trackingId: newOrder.trackingId,
                });
                if (emailResult.success) {
                    console.log("✅ Offline order email sent successfully");
                } else {
                    console.error("❌ Offline order email failed:", emailResult.message);
                }
            } catch (emailErr) {
                console.error("❌ Email helper crash (non-blocking):", emailErr);
            }
        }

        // ✅ Send WhatsApp (if enabled, reuse existing template)
        // Only send if confirmed or maybe send "Payment Link" whatsapp?
        // Current sendOrderConfirmation implies "Confirmation".
        // For now, only send if NOT Razorpay link, OR we need a sendPaymentLink template?
        // User didn't ask for new template. Let's send confirmation only if paid.
        if (sendWhatsApp && customerDetails.phone && !isRazorpayLink) {
            console.log(`📱 Attempting to send WhatsApp confirmation to ${customerDetails.phone}...`);
            try {
                const waResult = await sendOrderConfirmation(
                    customerDetails.name,
                    customerDetails.phone,
                    newOrder.orderId,
                    "Swaarasya", // Consistent merchant name
                    newOrder.deliveryPartner || "N/A"
                );
                if (waResult.success) {
                    console.log("✅ WhatsApp confirmation sent successfully");
                } else {
                    console.error("❌ WhatsApp confirmation failed:", waResult.message);
                }
            } catch (waErr) {
                console.error("❌ WhatsApp helper crash (non-blocking):", waErr);
            }
        }

        return NextResponse.json(
            {
                success: true,
                msg: isRazorpayLink ? "Payment Link Generated" : "Offline order created successfully",
                orderId: newOrder.orderId,
                invoiceId: newOrder.invoiceId, // Include in response
                offlorder: orderForNotification,
                paymentLink: paymentLinkData
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating offline order:", error);
        return NextResponse.json(
            { success: false, msg: "Internal Server Error" },
            { status: 500 }
        );
    }
};
