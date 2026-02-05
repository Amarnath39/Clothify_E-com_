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

connectDB();

// ✅ Reuse existing order ID generation logic
const generateOrderId = async (): Promise<string> => {
    try {
        const counter = await Counter.findOneAndUpdate(
            { id: "orderSeq" },
            { $inc: { seq: 1 } },
            { new: true, upsert: true }
        );

        const orderNumber = counter?.seq || 1801;
        return `ON-${orderNumber.toString().padStart(6, "0")}`;
    } catch (error) {
        console.error("Error generating order ID:", error);
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

        const products = await Product.find({ _id: { $in: uniqueProductIds } });

        if (products.length !== uniqueProductIds.length) {
            return NextResponse.json(
                { success: false, msg: "Some products not found" },
                { status: 404 }
            );
        }

        let totalActualPrice = 0;
        let totalOfferPrice = 0;
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
                        totalActualPrice += product.actualPrice * quantity;
                        totalOfferPrice +=
                            (sizeObj.offerPrice || product.actualPrice) * quantity;
                    }

                    return {
                        product: product._id,
                        count: quantity,
                        size: {
                            _id: sizeObj._id,
                            size: sizeObj.size
                        },
                        sizeLabel: sizeObj.size,
                        actualPrice: product.actualPrice,
                        offerPrice: sizeObj.offerPrice || product.actualPrice,
                    };
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
        const newOrder = new Order({
            orderId: await generateOrderId(),
            productDetails: processedProductDetails,
            totalPrice: totalActualPrice,
            payablePrice: totalPayablePrice,
            off: discount,
            shippingAddress: customerDetails.shippingAddress,
            shippingCost,
            paymentMethod: paymentMode,
            paymentStatus:
                paymentStatus === "Paid" ? "PAYMENT_SUCCESS" : "NOT_INITIATED",
            currentStatus: paymentStatus === "Paid" ? "COMPLETED" : "PENDING",
            date: new Date(),
            paidAt: paymentStatus === "Paid" ? new Date() : null,

            // ✅ NEW: Mark as offline order
            order_type: "OFFLINE",
            orderSource: "ADMIN_OFFLINE",
            createdBy: adminId,

            // ✅ Set shipping details based on method
            deliveryPartner:
                shippingMethod === "DTDC" ? "DTDC" : manualShipping?.courierName || "MANUAL",
            trackingId: manualShipping?.trackingNumber || "",
        });

        await newOrder.save();

        // ✅ Reduce inventory via centralized utility (ONLY IF PAID)
        if (paymentStatus === "Paid") {
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
        if (shippingMethod === "DTDC" && dtdcDetails && paymentStatus === "Paid") {
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
                            name: process.env.DTDC_ORIGIN_NAME || "SIS BY MP",
                            phone: process.env.DTDC_ORIGIN_PHONE || "6282667959",
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
        if (sendEmail && customerDetails.email) {
            console.log(`📧 Attempting to send offline order email to ${customerDetails.email}...`);
            try {
                const emailResult = await sendOfflineOrderEmail({
                    customerEmail: customerDetails.email,
                    customerName: customerDetails.name,
                    orderId: newOrder.orderId,
                    orderDetails: orderForNotification,
                    paymentMode,
                    paymentStatus,
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
        if (sendWhatsApp && customerDetails.phone) {
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
                msg: "Offline order created successfully",
                orderId: newOrder.orderId,
                offlorder: orderForNotification,
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
