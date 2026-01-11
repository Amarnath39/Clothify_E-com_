import { getPhonePeClient } from "@/lib/phonepeClient";
import { NextResponse } from "next/server";
import Order from "../../../../../model/Order";
import User from "../../../../../model/User";
import { connectDB } from "../../../../../../db";
import { sendUserOrderEmail } from "../../../../../helper/sendUserOrderEmail";
import { sendOrderConfirmation } from "../../../../../helper/whatsappNotifier";
import mongoose from "mongoose";
import axios from "axios";
import { generateRandomId } from "../../../../../helper/generateRandomId";
import Product from "../../../../../model/Product";

interface UserType {
  _id: mongoose.Types.ObjectId;
  email: string;
  name?: string;
  phone?: string;
  role?: string;
}

interface Params {
  params: { orderId: string };
}

export async function GET(req: Request, { params }: Params) {
  try {
    await connectDB();

    const { orderId } = params;
    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // 🔹 Get order
    const order = await Order.findOne({ tempTransactionId: orderId }).populate(
      "productDetails.product"
    );
    if (!order) {
      return NextResponse.json(
        { error: "Order not found in database" },
        { status: 404 }
      );
    }

    // 🔹 Validate user
    if (!mongoose.Types.ObjectId.isValid(order.user)) {
      return NextResponse.json(
        { error: "Invalid userId in order" },
        { status: 400 }
      );
    }

    const user = await User.findById(order.user).lean<UserType>();
    if (!user || !user.email) {
      return NextResponse.json(
        { error: "User not found or missing email" },
        { status: 404 }
      );
    }

    // 🔹 Idempotency check - if already processed, return existing data
    if (order.paymentStatus === "PAYMENT_SUCCESS") {
      console.log(`Order ${orderId} already processed. Returning existing data.`);
      return NextResponse.json({
        success: true,
        status: "COMPLETED",
        paymentStatus: "PAYMENT_SUCCESS",
        transactionId: order.transactionId,
        order: order,
        email: { success: true, message: "Already processed" },
      });
    }

    // 🔹 Call PhonePe API
    console.log(`🔍 Calling PhonePe getOrderStatus for orderId: ${orderId}`);

    let response: any;
    try {
      response = await getPhonePeClient().getOrderStatus(orderId);
      console.log("✅ RAW PHONEPE API RESPONSE:", JSON.stringify(response, null, 2));
    } catch (phonePeError: any) {
      console.error("❌ PHONEPE API ERROR:", {
        orderId,
        error: phonePeError.message,
        stack: phonePeError.stack,
        response: phonePeError.response?.data,
      });

      return NextResponse.json(
        {
          success: false,
          error: "Failed to check payment status with PhonePe",
          details: phonePeError.message,
          orderId,
        },
        { status: 500 }
      );
    }

    const phonePeState = response?.state || "PENDING";
    const phonePeCode = response?.code || "";
    const phonePeAmount = response?.amount ? response.amount / 100 : 0; // Convert from paise to rupees
    const transactionId = response?.transactionId || response?.orderId || orderId;
    const phonePeReferenceId = response?.merchantTransactionId || response?.referenceId || "";

    let paymentStatus = "Pending";
    let currentStatus = "PENDING";
    let paymentVerifiedAt: Date | undefined = undefined;

    // ✅ CRITICAL: PhonePe v2 only returns 'state', not 'code'
    // Check ONLY state === "COMPLETED" for v2 compatibility
    console.log(`📊 PhonePe Response: state="${phonePeState}", code="${phonePeCode}", amount=₹${phonePeAmount}`);

    if (phonePeState === "COMPLETED") {
      // Validate amount matches order total (allow 1 rupee tolerance for rounding)
      const amountDifference = Math.abs(phonePeAmount - order.payablePrice);
      console.log(`💰 Amount check: PhonePe=₹${phonePeAmount}, Order=₹${order.payablePrice}, Difference=₹${amountDifference}`);

      if (amountDifference > 1) {
        console.error(
          `⚠️ AMOUNT MISMATCH for order ${orderId}:`,
          `PhonePe amount: ₹${phonePeAmount}, Order amount: ₹${order.payablePrice}`
        );
        return NextResponse.json(
          {
            success: false,
            error: "Payment amount mismatch",
            details: {
              phonePeAmount: phonePeAmount,
              orderAmount: order.payablePrice,
              difference: amountDifference,
            },
          },
          { status: 400 }
        );
      }

      paymentStatus = "PAYMENT_SUCCESS";
      currentStatus = "CONFIRMED";
      paymentVerifiedAt = new Date();
      console.log(`✅ Payment verified for order ${orderId}. Amount: ₹${phonePeAmount}`);
    } else if (phonePeState === "FAILED" || phonePeCode === "PAYMENT_ERROR") {
      paymentStatus = "PAYMENT_ERROR";
      currentStatus = "FAILED";
      console.log(`❌ Payment failed for order ${orderId}. State: ${phonePeState}, Code: ${phonePeCode}`);
    } else {
      console.log(`⏳ Payment pending for order ${orderId}. State: ${phonePeState}, Code: ${phonePeCode}`);
    }

    // 🔹 Update order in DB with verification timestamp
    const updateData: any = {
      paymentStatus,
      transactionId,
      currentStatus,
    };

    if (paymentVerifiedAt) {
      updateData.paymentVerifiedAt = paymentVerifiedAt;
    }
    if (phonePeReferenceId) {
      updateData.phonePeReferenceId = phonePeReferenceId;
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { tempTransactionId: orderId },
      updateData,
      { new: true }
    ).populate("productDetails.product");

    if (!updatedOrder) {
      console.error("Order not found for tempTransactionId:", orderId);
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // ✅ Reduce stock if payment is successful
    // ✅ Reduce stock if payment is successful
    if (paymentStatus === "PAYMENT_SUCCESS") {
      console.log("✅ Payment successful, updating product stock...");

      for (const item of updatedOrder.productDetails) {
        console.log("DEBUG: Inspecting item:", JSON.stringify(item, null, 2));

        // 💡 ROBUST CHECK: Use the new fields from your schema.
        if (!item.sizeId) {
          console.error(
            `Skipping stock reduction for product ${item.product._id} in order ${updatedOrder.orderId} due to missing sizeId.`
          );
          continue; // Skip to the next item in the loop
        }

        const totalOrderedCount = (item.count || 0) + (item.freeCount || 0);

        // The product is already populated, no need to fetch it again.
        const product = item.product;
        if (!product) continue;

        // Find the size using the reliable sizeId.
        const sizeObj = product.sizes.find((s) => s._id.equals(item.sizeId));

        if (!sizeObj) {
          console.error(`Size with ID ${item.sizeId} not found in product ${product._id}. Stock not updated.`);
          continue; // Skip if the specific size isn't found in the product
        }

        // Update stock and sell count
        sizeObj.stock = Math.max(0, sizeObj.stock - totalOrderedCount);
        sizeObj.sellCount = (sizeObj.sellCount || 0) + totalOrderedCount;

        // This is a method on the parent document, so we save the whole product.
        await product.save();
        console.log(`✅ Stock updated for product ${product._id}, size ${sizeObj.size}. New stock: ${sizeObj.stock}`);
      }
    }


    // 🔹 Send email and WhatsApp if payment succeeded
    let emailResponse: {
      success: boolean;
      message: string;
      error?: any;
    } | null = null;

    if (paymentStatus === "PAYMENT_SUCCESS" && updatedOrder) {
      // Email
      emailResponse = await sendUserOrderEmail({
        ...updatedOrder.toObject(),
        orderId: updatedOrder.orderId || updatedOrder._id.toString(),
        customerEmail: user.email,
      });

      // WhatsApp
      try {
        const customerPhone =
          updatedOrder.shippingAddress?.mobile || user.phone || "";
        const customerName =
          updatedOrder.shippingAddress?.name || user.name || "Customer";

        const whatsappResp = await sendOrderConfirmation(
          customerName,
          customerPhone,
          updatedOrder.orderId || updatedOrder._id.toString(),
          order.merchantName || "S.I.S",
          order.deliveryPartner || "ANY"
        );

        console.log("📲 WhatsApp notification result:", whatsappResp);
      } catch (waErr) {
        console.error("❌ WhatsApp Confirmation Failed:", waErr);
      }

      // ✅ DTDC Integration (only on successful payment)
      try {
        const consignments = updatedOrder.productDetails.map(
          (item: any, index: number) => {
            const customerRef = generateRandomId(15);

            return {
              customer_code: "OO3772",
              service_type_id: "STD EXP-A",
              load_type: "NON-DOCUMENT",
              consignment_type: "Forward",
              description: "Clothes Shipment",
              dimension_unit: "cm",
              length: "1",
              width: "1",
              height: "1",
              weight_unit: "kg",
              weight: (item.count * 0.25).toString(),
              declared_value: order.payablePrice.toString(),
              num_pieces: item.count.toString(),

              origin_details: {
                name: "SIS BY MP",
                phone: 6282667959,
                address_line_1:
                  "PERUKAVU ",
                address_line_2: "VILAVOORKAL , MALAYINKEEZHU,",
                pincode: "695573",
                city: "THIRUVANANTHAPURAM",
                state: "KERALA",
              },

              destination_details: {
                name: updatedOrder.shippingAddress.name.toUpperCase() || "Customer",
                phone: updatedOrder.shippingAddress.phone || updatedOrder.shippingAddress.mobile || "0000000000",

                address_line_1:
                  updatedOrder.shippingAddress.address.toUpperCase() || "NA",
                address_line_2: updatedOrder.shippingAddress.address.toUpperCase() || "",
                pincode: updatedOrder.shippingAddress.zipCode || "000000",
                city: updatedOrder.shippingAddress.city || "NA",
                state:
                  updatedOrder.shippingAddress.state.toUpperCase() || "NA",
              },

              customer_reference_number: customerRef.toString(),
              cod_amount: "",
              cod_collection_mode: "",
              commodity_id: "99",
              eway_bill: "",
              is_risk_surcharge_applicable: false,
              invoice_number: customerRef.toString(),
              invoice_date: order.date.toISOString(),
              reference_number: "",

            };
          }
        );
        console.log("customer_reference_number:", consignments[0].customer_reference_number);
        console.log("destination address:", consignments[0].destination_details.address_line_1);
        console.log("destination phone:", consignments[0].destination_details.address_line_2);
        console.log("pin code:", consignments[0].destination_details.pincode);
        console.log("city:", consignments[0].destination_details.city);
        console.log("state:", consignments[0].destination_details.state);
        console.log("invoice number:", consignments[0].invoice_number);
        console.log("invoice date:", consignments[0].invoice_date);
        const payload = { consignments };

        const dtdcRes = await axios.post(
          "https://dtdcapi.shipsy.io/api/customer/integration/consignment/softdata",
          payload,
          {
            headers: {
              accept: "application/json",
              "Content-Type": "application/json",
              "api-key": "52256c0d05c94bda4c897dce29a485",

            },
          }
        );

        if (dtdcRes.data?.data?.[0]?.success) {
          await Order.findByIdAndUpdate(
            updatedOrder._id,
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
      }
    }

    // ✅ Return success response
    return NextResponse.json({
      success: true,
      status: phonePeState,
      paymentStatus,
      transactionId,
      order: updatedOrder,
      email: emailResponse || {
        success: false,
        message: "Email not sent (payment not successful)",
      },
    });
  } catch (error: any) {
    console.error("Payment status check error:", error);
    return NextResponse.json(
      { error: "Status check failed", details: error.message },
      { status: 500 }
    );
  }
}