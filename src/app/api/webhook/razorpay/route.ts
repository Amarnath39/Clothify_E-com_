// app/api/webhook/razorpay/route.ts

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import mongoose from "mongoose";
import { connectDB } from "../../../../../db";
import Order from "../../../../model/Order";
import Product from "../../../../model/Product";
import Coupon from "../../../../model/Coupon";
import { sendUserOrderEmail } from "../../../../helper/sendUserOrderEmail";
import {
    sendAdminOrderEmail,
    OrderDetails,
} from "../../../../helper/sendAdminOrderEmail";
import { sendOrderConfirmation, sendPOSInvoice } from "../../../../helper/whatsappNotifier";
import { sseClients } from "../../../../lib/sseClients";
import Razorpay from "razorpay";
import { updateStock } from "@/lib/stockManager";

// ═══════════════════════════════════════════════════════════════════════════
// WEBHOOK HANDLER
// ═══════════════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
    const startTime = Date.now();
    let webhookEvent = "unknown";

    // ⭐ READ BODY FIRST - Before ANY other operations
    // ⭐ READ RAW BODY - Using arrayBuffer for perfect signature match
    const arrayBuffer = await req.arrayBuffer();
    const bodyBuffer = Buffer.from(arrayBuffer);
    const body = bodyBuffer.toString("utf-8");
    const signature = req.headers.get("x-razorpay-signature");

    console.log("════════════════════════════════════════════════════════════");
    console.log("🔍 WEBHOOK DEBUG");
    console.log("📦 Body Length:", body.length);
    console.log("📦 Has Signature:", !!signature);
    console.log("📦 Body Preview:", body ? body.substring(0, 200) : "EMPTY");
    console.log("════════════════════════════════════════════════════════════\n");

    try {
        // ⭐ Now connect to DB AFTER reading body
        await connectDB();

        if (!body || !signature) {
            console.error("❌ Missing webhook body or signature");
            return NextResponse.json(
                { success: false, error: "Missing body or signature" },
                { status: 400 }
            );
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 2. Verify Webhook Signature
        // ─────────────────────────────────────────────────────────────────────────
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) {
            console.error("❌ RAZORPAY_WEBHOOK_SECRET not configured");
            return NextResponse.json(
                { success: false, error: "Webhook not configured" },
                { status: 500 }
            );
        }

        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(body)
            .digest("hex");

        if (expectedSignature !== signature) {
            console.error("❌ Invalid webhook signature");
            return NextResponse.json(
                { success: false, error: "Invalid signature" },
                { status: 400 }
            );
        }

        const payload = JSON.parse(body);
        webhookEvent = payload.event;

        console.log("📥 Webhook received:", {
            event: webhookEvent,
            timestamp: new Date().toISOString(),
        });
        // ═════════════════════════════════════════════════════════════════════════
        // EVENT: payment.captured → Order Confirmed & Fulfilled
        // ═════════════════════════════════════════════════════════════════════════
        if (webhookEvent === "payment.captured") {
            const payment = payload.payload.payment.entity;

            if (!payment?.order_id) {
                console.log("⚠️ No order_id in payment.captured event");
                return NextResponse.json({ success: true });
            }

            // ⭐ VALIDATE PAYMENT STATUS
            if (payment.status !== "captured") {
                console.log("⚠️ Payment not captured, status:", payment.status);
                return NextResponse.json({ success: true });
            }

            console.log("🔍 Processing payment:", {
                razorpayOrderId: payment.order_id,
                paymentId: payment.id,
                amount: payment.amount / 100,
                status: payment.status,
            });

            // ───────────────────────────────────────────────────────────────────────
            // Find Order
            // ───────────────────────────────────────────────────────────────────────
            let order = await Order.findOne({ razorpayOrderId: payment.order_id })
                .populate("user")
                .populate("productDetails.product");

            if (!order && payment.notes?.orderId) {
                // Fallback for Payment Links (Notes)
                console.log("🔍 Looking up order by notes:", payment.notes.orderId);
                order = await Order.findOne({ orderId: payment.notes.orderId })
                    .populate("user")
                    .populate("productDetails.product");
            }

            // Fallback: Parse Description (e.g. "Swaarasya POS Order #ON-12345" or "OFF-12345")
            if (!order && payment.description) {
                const match = payment.description.match(/Order #((?:ON|POS|OFF)-\d+)/);
                if (match) {
                    const extractedId = match[1];
                    console.log("🔍 Looking up order by description:", extractedId);
                    order = await Order.findOne({ orderId: extractedId })
                        .populate("user")
                        .populate("productDetails.product");
                }
            }

            if (!order) {
                console.error("❌ Order not found:", payment.order_id);
                return NextResponse.json({ success: true });
            }

            console.log("✅ Order found:", order.orderId);

            // ⭐ VALIDATE PAYMENT AMOUNT
            const expectedAmount = Math.round(order.payablePrice * 100); // Convert to paise
            if (payment.amount !== expectedAmount) {
                console.error("❌ AMOUNT MISMATCH:", {
                    expected: expectedAmount,
                    received: payment.amount,
                    orderId: order.orderId,
                    expectedRs: order.payablePrice,
                    receivedRs: payment.amount / 100,
                });

                // Log to order for manual review
                order.fulfillmentError = `Payment amount mismatch: Expected ₹${order.payablePrice}, Received ₹${payment.amount / 100}`;
                order.paymentStatus = "PAYMENT_AMOUNT_MISMATCH";

                if (!order.paymentLogs) order.paymentLogs = [];
                order.paymentLogs.push({
                    status: "AMOUNT_MISMATCH",
                    timestamp: new Date(),
                    details: {
                        expected: expectedAmount,
                        received: payment.amount,
                        paymentId: payment.id,
                    },
                });

                await order.save();

                return NextResponse.json(
                    {
                        success: false,
                        error: "Amount mismatch - manual review required",
                    },
                    { status: 400 }
                );
            }

            console.log("✅ Amount validated:", payment.amount / 100);

            // ───────────────────────────────────────────────────────────────────────
            // Idempotency Check
            // ───────────────────────────────────────────────────────────────────────
            if (order.paymentStatus === "PAYMENT_SUCCESS" && order.stockUpdated) {
                console.log("⚠️ Order already processed:", order.orderId);
                return NextResponse.json({
                    success: true,
                    message: "Already processed",
                });
            }

            // ═══════════════════════════════════════════════════════════════════════
            // ⭐ NO TRANSACTION - Direct updates for standalone MongoDB
            // ═══════════════════════════════════════════════════════════════════════
            try {
                // ─────────────────────────────────────────────────────────────────────
                // 1. Update Payment Status FIRST (so paymentMethod is set)
                // ─────────────────────────────────────────────────────────────────────
                order.transactionId = payment.id;
                order.paymentStatus = "PAYMENT_SUCCESS";
                order.paymentMethod = "RAZORPAY"; // ⭐ This is where it gets set
                order.currentStatus = order.order_type === "POS" ? "COMPLETED" : "PENDING"; // Offline/Online remain PENDING for shipping
                order.paidAt = new Date();

                // Update payment details
                if (!order.paymentDetails) {
                    order.paymentDetails = {};
                }
                order.paymentDetails.completedAt = new Date();

                // Log payment event
                if (!order.paymentLogs) order.paymentLogs = [];
                order.paymentLogs.push({
                    status: "PAYMENT_SUCCESS",
                    timestamp: new Date(),
                    details: {
                        paymentId: payment.id,
                        amount: payment.amount / 100,
                        method: payment.method,
                        email: payment.email,
                    },
                });

                console.log("✅ Payment status updated");

                // ═════════════════════════════════════════════════════════════════════
                // ⭐ CONSUME COUPON (After payment success, before stock update)
                // ═════════════════════════════════════════════════════════════════════
                if (order.couponCode) {
                    const code = order.couponCode.toUpperCase();
                    try {
                        const coupon = await Coupon.findOne({ couponCode: code });

                        if (!coupon) {
                            console.warn("⚠️ Coupon not found:", code);
                            order.paymentLogs.push({
                                status: "COUPON_WARNING",
                                timestamp: new Date(),
                                details: { couponCode: code, message: "Coupon not found in DB" },
                            });
                        } else {
                            // Atomic update: only increment if usage limit not exceeded and user hasn't used it
                            const filter: any = {
                                couponCode: code,
                                userCount: { $lt: coupon.availableFor },
                            };

                            // Only add user if coupon is single-use per user
                            if (!coupon.multiUse) {
                                filter.user = { $ne: order.user._id };
                            }

                            const update: any = { $inc: { userCount: 1 } };
                            if (!coupon.multiUse) {
                                update.$addToSet = { user: order.user._id };
                            }

                            const result = await Coupon.updateOne(filter, update);

                            if (result.modifiedCount === 0) {
                                console.warn("⚠️ Coupon could not be consumed:", code);
                                order.paymentLogs.push({
                                    status: "COUPON_LIMIT_REACHED",
                                    timestamp: new Date(),
                                    details: { couponCode: code, message: "Usage limit reached or user already applied" },
                                });
                            } else {
                                console.log("✅ Coupon consumed successfully:", code);
                                order.paymentLogs.push({
                                    status: "COUPON_CONSUMED",
                                    timestamp: new Date(),
                                    details: {
                                        couponCode: code,
                                        newUserCount: coupon.userCount + 1,
                                        multiUse: coupon.multiUse,
                                    },
                                });
                            }
                        }
                    } catch (err: any) {
                        console.error("❌ Coupon consumption error:", err.message);
                        order.paymentLogs.push({
                            status: "COUPON_ERROR",
                            timestamp: new Date(),
                            details: { couponCode: order.couponCode, error: err.message },
                        });
                    }
                }



                // -----------------------------------------------------------------------------
                // 2. Deduct Stock (Centralized)
                // -----------------------------------------------------------------------------
                if (!order.stockUpdated) {
                    console.log("📦 Updating stock via StockManager...");

                    const stockItems = order.productDetails.map((item: any) => ({
                        productId: item.product._id.toString(),
                        sizeId: item.size?._id?.toString(),
                        quantity: item.count + (item.freeCount || 0),
                        productName: item.product?.name,
                        sizeLabel: item.size?.size
                    })).filter((i: any) => i.sizeId);

                    // Determine Source: ONLINE, POS, or OFFLINE
                    const orderSource = order.paymentMethod === "COD" ? "ONLINE" :
                        (order.order_type === "POS" ? "POS" :
                            (order.order_type === "OFFLINE" ? "OFFLINE" : "ONLINE"));

                    const stockResult = await updateStock(
                        stockItems,
                        "SALE",
                        orderSource,
                        order.orderId,
                        order.createdBy // Pass admin ID for POS/Offline attribution
                    );
                    if (!stockResult.success) {
                        const errorMsg = stockResult.errors?.join("; ") || "Stock update failed";
                        console.error("❌ Stock Update Failed:", errorMsg);

                        order.fulfillmentError = errorMsg;
                        order.currentStatus = "PENDING_STOCK";

                        order.paymentLogs.push({
                            status: "STOCK_ERROR",
                            timestamp: new Date(),
                            details: { errors: stockResult.errors },
                        });

                        await order.save();
                        return NextResponse.json(
                            { success: true, warning: "Stock issue", errors: stockResult.errors },
                            { status: 200 }
                        );
                    }

                    order.stockUpdated = true;
                    console.log("✅ Stock updated successfully");
                }


                // ─────────────────────────────────────────────────────────────────────
                // 3. Save Order
                // ─────────────────────────────────────────────────────────────────────
                await order.save();
                console.log("✅ Order saved:", order.orderId);
                console.log("✅ Payment method set to:", order.paymentMethod);

                // ─────────────────────────────────────────────────────────────────────
                // 4. Send SSE Update (Real-time notification)
                // ─────────────────────────────────────────────────────────────────────
                const client = sseClients.get(order.orderId);
                if (client) {
                    try {
                        client.write(
                            `data: ${JSON.stringify({
                                paymentStatus: "PAYMENT_SUCCESS",
                                currentStatus: "PENDING",
                                orderId: order.orderId,
                            })}\n\n`
                        );
                        client.end();

                        // Cleanup
                        if (client.pollTimer) clearInterval(client.pollTimer);
                        if (client.keepAlive) clearInterval(client.keepAlive);
                        sseClients.delete(order.orderId);

                        console.log("✅ SSE notification sent");
                    } catch (err) {
                        console.error("❌ SSE send failed:", err);
                        // Force cleanup on error
                        if (client.pollTimer) clearInterval(client.pollTimer);
                        if (client.keepAlive) clearInterval(client.keepAlive);
                        sseClients.delete(order.orderId);
                    }
                }

                // ─────────────────────────────────────────────────────────────────────
                // 5. Fire-and-Forget: Emails & WhatsApp
                // ─────────────────────────────────────────────────────────────────────
                setImmediate(async () => {
                    console.log("📧 Sending notifications...");

                    // Email to customer
                    try {
                        await sendUserOrderEmail(order);
                        console.log("  ✅ Customer email sent");
                    } catch (e) {
                        console.error("  ❌ Customer email failed:", e);
                    }

                    // Email to admin
                    const orderInfo: OrderDetails = {
                        orderId: order.orderId,
                        customerName: order.shippingAddress?.name || "Customer",
                        customerEmail: order.user?.email || "",
                        totalAmount: order.payablePrice,
                        orderDate: new Date().toLocaleDateString("en-IN"),
                    };

                    try {
                        await sendAdminOrderEmail(orderInfo);
                        console.log("  ✅ Admin email sent");
                    } catch (e) {
                        console.error("  ❌ Admin email failed:", e);
                    }

                    // WhatsApp notification
                    if (order.shippingAddress?.mobile) {
                        try {
                            if (order.order_type === "POS") {
                                // ✅ Send POS-specific Invoice link
                                const invoiceUrl = `https://www.swaarasya.com/invoice/${order.invoiceId}`;
                                await sendPOSInvoice(
                                    order.shippingAddress.name || "Customer",
                                    order.shippingAddress.mobile,
                                    order.orderId,
                                    invoiceUrl,
                                    "Swaarasya"
                                );
                                console.log("  ✅ WhatsApp POS invoice sent");
                            } else {
                                // Standard online order confirmation
                                await sendOrderConfirmation(
                                    order.shippingAddress.name,
                                    order.shippingAddress.mobile,
                                    order.orderId,
                                    "Swaarasya",
                                    "DTDC"
                                );
                                console.log("  ✅ WhatsApp order confirmation sent");
                            }
                        } catch (e) {
                            console.error("  ❌ WhatsApp failed:", e);
                        }
                    }
                });

                const processingTime = Date.now() - startTime;
                console.log(
                    `✅ Webhook processed successfully in ${processingTime}ms`
                );

                return NextResponse.json({
                    success: true,
                    orderId: order.orderId,
                    processingTime,
                });

            } catch (err: any) {
                console.error("❌ Order processing failed:", err.message);

                // Log error to order
                try {
                    const errorMessage = err.message || "Order processing failed";

                    await Order.findByIdAndUpdate(order._id, {
                        fulfillmentError: errorMessage,
                        $push: {
                            paymentLogs: {
                                status: "PROCESSING_ERROR",
                                timestamp: new Date(),
                                details: {
                                    error: errorMessage,
                                    type: "WEBHOOK_PROCESSING_ERROR"
                                },
                            },
                        },
                    });

                    console.log("✅ Error logged to order for manual review");

                } catch (logError) {
                    console.error("Failed to log error:", logError);
                }

                // Return success to Razorpay (payment was valid, processing issue is internal)
                return NextResponse.json(
                    {
                        success: true,
                        warning: "Payment successful but order processing failed - manual review required",
                        error: err.message
                    },
                    { status: 200 }
                );
            }
        }

        // ═════════════════════════════════════════════════════════════════════════
        // EVENT: payment.failed → Update Order Status
        // ═════════════════════════════════════════════════════════════════════════
        if (webhookEvent === "payment.failed") {
            const payment = payload.payload.payment.entity;

            if (!payment?.order_id) {
                return NextResponse.json({ success: true });
            }

            console.log("❌ Payment failed:", {
                razorpayOrderId: payment.order_id,
                error: payment.error_description,
            });

            const order = await Order.findOne({ razorpayOrderId: payment.order_id });

            if (order && order.paymentStatus !== "PAYMENT_SUCCESS") {
                order.paymentStatus = "PAYMENT_DECLINED";
                order.paymentMethod = "RAZORPAY"; // ⭐ Set payment method even for failed payments
                order.paymentError = payment.error_description || "Payment failed";

                if (!order.paymentLogs) order.paymentLogs = [];
                order.paymentLogs.push({
                    status: "PAYMENT_FAILED",
                    timestamp: new Date(),
                    details: {
                        error: payment.error_description,
                        errorCode: payment.error_code,
                        method: payment.method,
                    },
                });

                await order.save();
                console.log("✅ Order marked as failed:", order.orderId);
            }

            return NextResponse.json({ success: true });
        }

        // ═════════════════════════════════════════════════════════════════════════
        // EVENT: payment_link.paid → Payment Link Successfully Paid
        // ═════════════════════════════════════════════════════════════════════════
        // ═════════════════════════════════════════════════════════════════════════
        // EVENT: payment_link.paid → Payment Link Successfully Paid
        // ═════════════════════════════════════════════════════════════════════════
        if (webhookEvent === "payment_link.paid") {
            const paymentLink = payload.payload.payment_link.entity;

            console.log("✅ Payment link paid:", {
                paymentLinkId: paymentLink.id,
                amount: paymentLink.amount / 100,
                status: paymentLink.status,
                reference_id: paymentLink.reference_id
            });

            // 1. Find by Link ID
            let order = await Order.findOne({
                "metadata.paymentLinkId": paymentLink.id
            })
                .populate("user")
                .populate("productDetails.product");

            // 2. Fallback: search by reference_id (Handle Suffix!)
            if (!order && paymentLink.reference_id) {
                // Try exact match first
                order = await Order.findOne({ orderId: paymentLink.reference_id })
                    .populate("user")
                    .populate("productDetails.product");

                // If not found, try stripping suffix (Format: ON-12345-random)
                if (!order) {
                    const cleanOrderId = paymentLink.reference_id.split("-").slice(0, 2).join("-");
                    console.log("🔍 Trying stripped order ID:", cleanOrderId);
                    order = await Order.findOne({ orderId: cleanOrderId })
                        .populate("user")
                        .populate("productDetails.product");
                }
            }

            if (!order) {
                console.error("❌ Order not found for payment link:", paymentLink.id);
                return NextResponse.json({ success: true });
            }

            console.log("✅ Order found:", order.orderId);

            // Validate amount
            const expectedAmount = Math.round(order.payablePrice * 100);
            if (paymentLink.amount !== expectedAmount) {
                console.error("❌ AMOUNT MISMATCH for payment link:", {
                    expected: expectedAmount,
                    received: paymentLink.amount,
                    orderId: order.orderId
                });

                order.paymentStatus = "PAYMENT_AMOUNT_MISMATCH";
                order.paymentLogs = order.paymentLogs || [];
                order.paymentLogs.push({
                    status: "AMOUNT_MISMATCH",
                    timestamp: new Date(),
                    details: {
                        expected: expectedAmount,
                        received: paymentLink.amount,
                        paymentLinkId: paymentLink.id
                    }
                });
                await order.save();

                return NextResponse.json(
                    { success: false, error: "Amount mismatch" },
                    { status: 400 }
                );
            }

            // Check if already processed
            // Note: We check if paymentStatus is success AND stockUpdated to be sure.
            // But for offline orders initialized as PENDING, we need to process even if paymentStatus was somehow set (rare via link).
            if (order.paymentStatus === "PAYMENT_SUCCESS" && order.stockUpdated) {
                console.log("⚠️ Payment link already processed:", order.orderId);
                return NextResponse.json({
                    success: true,
                    message: "Already processed"
                });
            }

            // 🚀 FULL FULFILLMENT LOGIC (Offline Order Fix)
            try {
                // 1. Update Status
                order.paymentStatus = "PAYMENT_SUCCESS";
                order.metadata.paymentLinkStatus = "paid";
                order.metadata.paymentLinkPaidAt = new Date();
                order.paidAt = new Date();
                order.paymentMethod = order.paymentMethod || "RAZORPAY_LINK";

                // Update current status if it was just created (Pending)
                if (order.currentStatus === "PENDING" || order.currentStatus === "CHECKOUT") {
                    order.currentStatus = order.order_type === "POS" ? "COMPLETED" : "PENDING";
                }

                // 2. Deduct Stock Only if NOT already done
                if (!order.stockUpdated) {
                    console.log("📦 Payment Link Paid: Reducing Stock...");

                    const stockItems = order.productDetails.map((item: any) => ({
                        productId: item.product._id.toString(),
                        sizeId: item.size?._id?.toString(),
                        quantity: item.count + (item.freeCount || 0),
                        productName: item.product?.name,
                        sizeLabel: item.size?.size
                    })).filter((i: any) => i.sizeId);

                    const orderSource = order.order_type === "OFFLINE" ? "OFFLINE" : (order.order_type === "POS" ? "POS" : "ONLINE");
                    const adminId = order.metadata?.adminId || order.createdBy;

                    const stockResult = await updateStock(
                        stockItems,
                        "SALE",
                        orderSource,
                        order.orderId,
                        adminId
                    );

                    if (stockResult.success) {
                        order.stockUpdated = true;
                        console.log("✅ Stock updated for payment link order");
                    } else {
                        console.log("❌ Stock update failed for payment link:", stockResult.errors);
                        order.fulfillmentError = "Stock update failed: " + (stockResult.errors || []).join(", ");
                    }
                }

                // 3. Save Order
                await order.save();
                console.log("✅ Order updated via Payment Link event");

                // 4. Notifications (WhatsApp & Email)
                setImmediate(async () => {

                    // WhatsApp: Handle "phone" vs "mobile" field mismatch for Offline Orders
                    const customerPhone = order.shippingAddress?.mobile || order.shippingAddress?.phone;

                    if (customerPhone) {
                        try {
                            if (order.order_type === "POS") {
                                // POS Invoice
                                const invoiceUrl = `https://www.swaarasya.com/invoice/${order.invoiceId}`;
                                await sendPOSInvoice(
                                    order.shippingAddress.name || "Customer",
                                    customerPhone,
                                    order.orderId,
                                    invoiceUrl,
                                    "Swaarasya"
                                );
                            } else {
                                // Standard / Offline Confirmation
                                await sendOrderConfirmation(
                                    order.shippingAddress.name || "Customer",
                                    customerPhone,
                                    order.orderId,
                                    "Swaarasya",
                                    order.deliveryPartner || "DTDC"
                                );
                            }
                            console.log(`✅ WhatsApp sent to ${customerPhone}`);
                        } catch (e) {
                            console.error("❌ WhatsApp failed:", e);
                        }
                    } else {
                        console.warn("⚠️ No phone number found for WhatsApp notification");
                    }

                    // Email (Offline orders might want re-confirmation or usually just initial creation email. 
                    // But if this is a "Payment Received" flow, we might want to send admin email or user email if not sent.)
                    // Use existing helpers.
                    try {
                        // Send User Email
                        /* 
                          Note: sendUserOrderEmail helper usually expects standard structure.
                          If offline order has email in user object (which might be null), fallback to shippingAddress email if stored?
                          Offline orders usually store email in customerDetails (shippingAddress/billingAddress doesn't strictly enforce email field in schema usually).
                          Let's check if we can send based on metadata or user.
                        */
                        if (order.user) {
                            await sendUserOrderEmail(order);
                            console.log("✅ User email sent");
                        } else if (order.metadata?.customerEmail) {
                            // Custom logic if valid, but for now skip if no linked user to avoid crash
                        }

                        // Send Admin Notification
                        const orderInfo: OrderDetails = {
                            orderId: order.orderId,
                            customerName: order.shippingAddress?.name || "Customer",
                            customerEmail: order.user?.email || "Offline Customer",
                            totalAmount: order.payablePrice,
                            orderDate: new Date().toLocaleDateString("en-IN"),
                        };
                        await sendAdminOrderEmail(orderInfo);
                        console.log("✅ Admin email sent");

                    } catch (e) { console.error("❌ Email notifications failed", e) }

                });

            } catch (err: any) {
                console.error("❌ Payment Link Processing Failed:", err);
                // Don't fail the webhook response, just log
            }

            return NextResponse.json({ success: true, orderId: order.orderId });
        }

        // ═════════════════════════════════════════════════════════════════════════
        // EVENT: payment_link.expired → Payment Link Expired
        // ═════════════════════════════════════════════════════════════════════════
        if (webhookEvent === "payment_link.expired") {
            const paymentLink = payload.payload.payment_link.entity;

            console.log("⏰ Payment link expired:", paymentLink.id);

            let order = await Order.findOne({
                "metadata.paymentLinkId": paymentLink.id
            });

            if (!order && paymentLink.reference_id) {
                order = await Order.findOne({ orderId: paymentLink.reference_id });
            }

            if (!order) {
                console.log("⚠️ Order not found for expired payment link");
                return NextResponse.json({ success: true });
            }

            // Only update if payment wasn't already successful
            if (order.paymentStatus !== "PAYMENT_SUCCESS") {
                order.currentStatus = "CANCELLED";
                order.paymentStatus = "PAYMENT_LINK_EXPIRED";
                order.metadata.paymentLinkStatus = "expired";

                order.paymentLogs = order.paymentLogs || [];
                order.paymentLogs.push({
                    status: "PAYMENT_LINK_EXPIRED",
                    timestamp: new Date(),
                    details: {
                        paymentLinkId: paymentLink.id,
                        expiredAt: paymentLink.expired_at
                    }
                });

                await order.save();
                console.log("✅ Order marked as expired:", order.orderId);
            }

            return NextResponse.json({ success: true });
        }

        // ═════════════════════════════════════════════════════════════════════════
        // EVENT: payment_link.cancelled → Payment Link Cancelled
        // ═════════════════════════════════════════════════════════════════════════
        if (webhookEvent === "payment_link.cancelled") {
            const paymentLink = payload.payload.payment_link.entity;

            console.log("❌ Payment link cancelled:", paymentLink.id);

            let order = await Order.findOne({
                "metadata.paymentLinkId": paymentLink.id
            });

            if (!order && paymentLink.reference_id) {
                order = await Order.findOne({ orderId: paymentLink.reference_id });
            }

            if (!order) {
                console.log("⚠️ Order not found for cancelled payment link");
                return NextResponse.json({ success: true });
            }

            // Only update if payment wasn't already successful
            if (order.paymentStatus !== "PAYMENT_SUCCESS") {
                order.currentStatus = "CANCELLED";
                order.paymentStatus = "PAYMENT_LINK_CANCELLED";
                order.metadata.paymentLinkStatus = "cancelled";

                order.paymentLogs = order.paymentLogs || [];
                order.paymentLogs.push({
                    status: "PAYMENT_LINK_CANCELLED",
                    timestamp: new Date(),
                    details: {
                        paymentLinkId: paymentLink.id,
                        cancelledBy: paymentLink.cancelled_by || "system"
                    }
                });

                await order.save();
                console.log("✅ Order marked as cancelled:", order.orderId);
            }

            return NextResponse.json({ success: true });
        }

        // ═════════════════════════════════════════════════════════════════════════
        // OTHER EVENTS: Log and acknowledge
        // ═════════════════════════════════════════════════════════════════════════
        console.log("ℹ️ Unhandled webhook event:", webhookEvent);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("💥 Webhook crashed:", {
            event: webhookEvent,
            error: error.message,
            stack: error.stack,
        });

        // Always return 200 to prevent Razorpay retries on server errors
        return NextResponse.json({ success: false }, { status: 200 });
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// CORS Preflight Handler
// ═══════════════════════════════════════════════════════════════════════════
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, x-razorpay-signature",
        },
    });
}