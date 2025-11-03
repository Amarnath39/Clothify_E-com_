export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import Order from "../../../../../model/Order";
import Admin from "../../../../../model/Admin";
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
    const { status, trackingId, deliveryPartner ,merchantName } = body;

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

    if (status === "Shipped") {
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

    return NextResponse.json({ success: true, msg: "Success", order }, { status: 200 });
  } catch (error) {
    console.log("Error to update admin order details", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};
