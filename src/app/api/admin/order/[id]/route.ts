export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import Order from "../../../../../model/Order";
import Admin from "../../../../../model/Admin";
import mongoose from "mongoose";
import Product from "../../../../../model/Product";
import { sendOrderShippedEmail } from "../../../../../helper/sendOrderShippedEmail";
import { sendOrderConfirmation, sendOrderTracking } from "../../../../../helper/whatsappNotifier"; // ✅ Import your first function

export const PATCH = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const adminId = req.headers.get("x-admin-id");
    if (!adminId) {
      return NextResponse.json(
        { success: false, msg: "Please provide Admin Id" },
        { status: 400 }
      );
    }

    const admin = await Admin.findById(adminId);
    if (!admin || (admin.role !== "Admin" && admin.role !== "SuperAdmin")) {
      return NextResponse.json(
        { success: false, msg: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { status, trackingId, deliveryPartner, merchantName } = body;

    if (!id)
      return NextResponse.json(
        { success: false, msg: "Please provide OrderId" },
        { status: 400 }
      );

    const newOrder: any = {};
    if (status) newOrder.currentStatus = status;
    if (trackingId) newOrder.trackingId = trackingId;
    if (deliveryPartner) newOrder.deliveryPartner = deliveryPartner;

    const order = await Order.findByIdAndUpdate(
      id,
      { $set: newOrder },
      { new: true }
    ).populate("user");

    if (!order) {
      return NextResponse.json(
        { success: false, msg: "Order not found" },
        { status: 404 }
      );
    }

    // ✅ Stock Reduction Logic: If status changes to CONFIRMED (and wasn't before)
    // and paymentStatus is NOT already success (to avoid double count if logic overlaps)
    if (status === "CONFIRMED" && order.currentStatus !== "CONFIRMED") {
      console.log("Creating stock reduction for confirmed order:", id);

      const productDetails = order.productDetails || [];
      for (const item of productDetails) {
        try {
          // Re-fetch product to ensure fresh stock data
          const product = await Product.findById(item.product);
          if (product) {
            const sizeObj = product.sizes.find((s: any) =>
              s._id.toString() === item.sizeId?.toString()
            );

            if (sizeObj) {
              const count = item.count + (item.freeCount || 0);
              sizeObj.stock = Math.max(0, sizeObj.stock - count);
              sizeObj.sellCount = (sizeObj.sellCount || 0) + count;
              await product.save();
              console.log(`Decremented stock for ${item.product} size ${sizeObj.size}`);
            }
          }
        } catch (err) {
          console.error("Error reducing stock during status update:", err);
        }
      }
    }

    if (status === "Shipped") {

      // ✅ Pre-booking Stock Reduction (Delayed until Shipped)
      if (order.order_type === "prebooking") {
        console.log("📦 Pre-booking Order Shipped: Reducing stock now.");
        const productDetails = order.productDetails || [];
        for (const item of productDetails) {
          try {
            const product = await Product.findById(item.product);
            if (product) {
              const sizeObj = product.sizes.find((s: any) =>
                s._id.toString() === item.sizeId?.toString()
              );
              if (sizeObj) {
                const count = (item.count || 0) + (item.freeCount || 0);
                sizeObj.stock = Math.max(0, sizeObj.stock - count);
                sizeObj.sellCount = (sizeObj.sellCount || 0) + count;
                await product.save();
                console.log(`Stock reduced for pre-booking product ${product._id}`);
              }
            }
          } catch (err) {
            console.error("Error reducing pre-booking stock:", err);
          }
        }
      }
      const emailDetails = {
        trackingId: order.trackingId,
        deliveryPartner: order.deliveryPartner,
        userName: order.user.name,
        userEmail: order.user.email,
        companyName: "S.I.S",
      };

      // ✅ Send email
      await sendOrderShippedEmail(emailDetails);

      // ✅ Send WhatsApp tracking details (using your first function)
      const whatsappResp = await sendOrderTracking(
        order.user.name,          // customerName
        order.user.phone,         // phoneNumber
        order.trackingId || "",   // trackingId
        order.deliveryPartner || "",  // deliveryPartner
        order.merchantName || "S.I.S"
      );

      console.log("📲 WhatsApp notification result:", whatsappResp);
    }

    // ✅ Stock Management Integration
    const confirmationStatuses = ["Processing", "Shipped", "Delivered", "COMPLETED"];
    // Modified to skip prebooking orders to avoid double reduction or early reduction
    if (confirmationStatuses.includes(status) && !order.stockReduced && order.order_type !== 'prebooking') {
      // Try to reduce stock for COD orders or manual confirmations
      const { reduceStock } = await import("@/lib/inventory");
      await reduceStock(order._id);
    } else if (status === "Cancelled" && order.stockReduced) {
      // Restore stock for cancellations
      const { restoreStock } = await import("@/lib/inventory");
      await restoreStock(order._id);
    }

    return NextResponse.json({ success: true, msg: "Success", order }, { status: 200 });
  } catch (error) {
    console.log("Error to update admin order details", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const GET = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const adminId = req.headers.get("x-admin-id");
    if (!adminId) {
      return NextResponse.json(
        { success: false, msg: "Please provide Admin Id" },
        { status: 400 }
      );
    }

    const { id } = params;
    if (!id || id === "undefined") {
      return NextResponse.json({ success: false, msg: "Invalid Order ID" }, { status: 400 });
    }

    let order;
    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id).populate("user").populate("productDetails.product");
    } else {
      order = await Order.findOne({ orderId: id }).populate("user").populate("productDetails.product");
    }

    if (!order) {
      return NextResponse.json(
        { success: false, msg: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order }, { status: 200 });
  } catch (error) {
    console.log("Error fetching admin order details", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};
