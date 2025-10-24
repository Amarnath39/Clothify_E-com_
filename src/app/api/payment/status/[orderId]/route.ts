import { getPhonePeClient } from "@/lib/phonepeClient";
import { NextResponse } from "next/server";
import Order from "../../../../../model/Order";
import User from "../../../../../model/User";
import { connectDB } from "../../../../../../db";
import { sendUserOrderEmail } from "../../../../../helper/sendUserOrderEmail";
import { sendOrderConfirmation } from "../../../../../helper/whatsappNotifier";
import mongoose from "mongoose";
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

    // 🔹 Call PhonePe API
    const response: any = await getPhonePeClient().getOrderStatus(orderId);
    // ✅ ADD THIS LINE TO DEBUG
console.log("RAW PHONEPE API RESPONSE:", JSON.stringify(response, null, 2));
    console.log("PhonePe Response:", response);

    const phonePeState = response?.state || "PENDING";
    const transactionId = response?.orderId || orderId;

    let paymentStatus = "Pending";
    let currentStatus = "PENDING";

    if (phonePeState === "COMPLETED") {
      paymentStatus = "PAYMENT_SUCCESS";
      currentStatus = "CONFIRMED";
    } else if (phonePeState === "FAILED") {
      paymentStatus = "PAYMENT_ERROR";
      currentStatus = "FAILED";
    }

    // 🔹 Update order in DB
    const updatedOrder = await Order.findOneAndUpdate(
      { tempTransactionId: orderId },
      { paymentStatus, transactionId, currentStatus },
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