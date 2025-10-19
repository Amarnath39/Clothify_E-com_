import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../db";
import User from "../../../../model/User";
import Order from "../../../../model/Order";
import Product from "../../../../model/Product"; // ✅ Import Product model
import { sendAdminOrderEmail } from "../../../../helper/sendAdminOrderEmail";
import { sendUserOrderEmail } from "../../../../helper/sendUserOrderEmail";
import { sendOrderConfirmation } from "../../../../helper/whatsappNotifier";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // 1️⃣ Get userId from headers
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, msg: "Please provide User Id" },
        { status: 400 }
      );
    }

    // 2️⃣ Validate user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
    }

    // 3️⃣ Parse request body
    const body = await req.json();
    const { orderId }: { orderId: string } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // 4️⃣ Find order by _id or custom orderId
    let order = await Order.findById(orderId);
    if (!order) {
      order = await Order.findOne({ orderId });
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 5️⃣ Update order status
    order.OrderStatus = "Completed";
    order.currentStatus = "Pending";
    order.date = new Date();
    await order.save();

    // 6️⃣ Reduce stock in Product DB
    for (const item of order.productDetails) {
      const totalOrderedCount = (item.count || 0) + (item.freeCount || 0);

      const productId = item.product._id;
      const sizeName = item.size.size;

      const product = await Product.findById(productId);
      if (!product) continue;

      const sizeObj = product.sizes.find((s) => s.size === sizeName);
      if (!sizeObj) continue;

      sizeObj.stock = Math.max(0, sizeObj.stock - totalOrderedCount);
      sizeObj.sellCount = (sizeObj.sellCount || 0) + totalOrderedCount;

      await product.save();
    }

    // 7️⃣ Send admin notification email
    const adminOrderDetails = {
      orderId: order.orderId || order._id.toString(),
      customerName: user.name || "Unknown Customer",
      totalAmount:
        order.payablePrice?.toString() ||
        order.totalPrice?.toString() ||
        "N/A",
      orderDate: new Date(order.date).toLocaleString(),
      customerEmail: user.email || "N/A",
    };

    await sendAdminOrderEmail(adminOrderDetails);

    // 8️⃣ Send confirmation email to user
    const userOrderData = {
      orderId: order.orderId || order._id.toString(),
      payablePrice: order.payablePrice || order.totalPrice || 0,
      OrderStatus: order.OrderStatus || "Completed",
      user: { email: user.email },
      customerEmail: user.email,
    };

    const userEmailResponse = await sendUserOrderEmail(userOrderData);

    // 9️⃣ Send WhatsApp order confirmation using User database fields
    let whatsappResponse;
    try {
      const customerPhone = user.phone || "";
      const customerName = user.name || "Customer";

      if (!customerPhone || customerPhone.length < 10) {
        whatsappResponse = { success: false, message: "Invalid or missing phone number" };
        console.warn("WhatsApp not sent, phone number missing:", customerPhone);
      } else {
        whatsappResponse = await sendOrderConfirmation(
          customerName,
          customerPhone,
          order.orderId || order._id.toString(),
          order.merchantName || "SIS", // default merchant name
          order.deliveryPartner || "DTDC"
        );
      }

      console.log("📲 WhatsApp notification result:", whatsappResponse);
    } catch (waErr) {
      console.error("❌ WhatsApp Confirmation Failed:", waErr);
      whatsappResponse = { success: false, message: "WhatsApp send failed", error: waErr };
    }

    // 🔟 Final response
    return NextResponse.json({
      success: true,
      msg: "Order updated successfully. Notifications sent, stock reduced.",
      adminEmailStatus: "sent",
      userEmailStatus: userEmailResponse.success
        ? "sent"
        : `failed: ${userEmailResponse.message}`,
      whatsappStatus: whatsappResponse.success
        ? "sent"
        : `failed: ${whatsappResponse.message}`,
      orderId: order.orderId,
      OrderStatus: order.OrderStatus,
      currentStatus: order.currentStatus,
    });
  } catch (error: any) {
    console.error("❌ Order update error:", error);
    return NextResponse.json(
      { error: "Order update failed", details: error.message },
      { status: 500 }
    );
  }
}