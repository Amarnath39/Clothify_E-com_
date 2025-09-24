import { getPhonePeClient } from "@/lib/phonepeClient";
import { NextResponse } from "next/server";
import Order from "../../../../../../model/Order";
import User from "../../../../../../model/User";
import { connectDB } from "../../../../../../db";
import { sendUserOrderEmail } from "../../../../../../helper/sendUserOrderEmail";
import mongoose from "mongoose";
import axios from "axios";
import { generateRandomId } from "../../../../../../helper/generateRandomId";

interface UserType {
  _id: mongoose.Types.ObjectId;
  email: string;
  name?: string;
  phone?: string;
  role?: string;
}

interface Params {
  params: { orderId: string }; // frontend sends tempTransactionId
}

export async function GET(req: Request, { params }: Params) {
  try {
    await connectDB();

    const { orderId } = params;
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // 🔹 Get order first
    const order = await Order.findOne({ tempTransactionId: orderId }).populate("productDetails.product");
    if (!order) {
      return NextResponse.json({ error: "Order not found in database" }, { status: 404 });
    }

    // 🔹 Validate user
    if (!mongoose.Types.ObjectId.isValid(order.user)) {
      return NextResponse.json({ error: "Invalid userId in order" }, { status: 400 });
    }

    const user = await User.findById(order.user).lean<UserType>();
    if (!user || !user.email) {
      return NextResponse.json({ error: "User not found or missing email" }, { status: 404 });
    }

    // 🔹 Call PhonePe API
    const response: any = await getPhonePeClient().getOrderStatus(orderId);
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

    // 🔹 Update order
    const updatedOrder = await Order.findOneAndUpdate(
      { tempTransactionId: orderId },
      {
        paymentStatus,
        transactionId,
        currentStatus,
      },
      { new: true }
    ).populate("productDetails.product");

    // 📧 Send confirmation email if payment success
    let emailResponse: { success: boolean; message: string; error?: any } | null = null;

    if (paymentStatus === "PAYMENT_SUCCESS" && updatedOrder) {
      emailResponse = await sendUserOrderEmail({
        ...updatedOrder.toObject(),
        orderId: updatedOrder.orderId || updatedOrder._id.toString(),
        customerEmail: user.email,
      });

      // inside your if (paymentStatus === "PAYMENT_SUCCESS" && updatedOrder) { ... }

try {
  const customerNo = generateRandomId(15);

  // Map each product into a v2 payload object
  const consignments = updatedOrder.productDetails.map((v: any) => ({
    action_type: "single_pickup",
    consignment_type: "forward",
    movement_type: "forward",
    load_type: "NON-DOCUMENT",
    description: v.product.name,
    customer_code: "OO3609",
    reference_number: "", // you can generate or leave blank
    service_type_id: "B2C Priority",

    // Optional COD fields (skip if prepaid)
    cod_favor_of: updatedOrder.shippingAddress.name,
    cod_collection_mode: "cash",
    cod_amount: v.product.offerPrice,

    // Dimensions & weight
    dimension_unit: "cm",
    length: "1",
    width: "1",
    height: "1",
    weight_unit: "kg",
    weight: "0.25",
    num_pieces: v.count + (v.freeCount || 0),

    // Values
    declared_value: v.product.offerPrice,
    invoice_amount: v.product.offerPrice,
    invoice_number: `INV-${Date.now()}`,
    invoice_date: new Date().toISOString().slice(0, 10),
    declared_value_without_tax: v.product.offerPrice,
    customer_reference_number: customerNo,

    // Origin (your store/warehouse)
    origin_details: {
      name: "Udayaada",
      phone: "8123000558",
      address_line_1: "Thalaserry",
      address_line_2: "Post Palayad",
      pincode: "670102",
      city: "CANNANORE",
      state: "Kerala",
      country: "India",
    },

    // Destination (customer address)
    destination_details: {
      name: updatedOrder.shippingAddress.name,
      phone: updatedOrder.shippingAddress.mobile,
      address_line_1: updatedOrder.shippingAddress.address,
      address_line_2: "",
      pincode: updatedOrder.shippingAddress.zipCode,
      city: updatedOrder.shippingAddress.state,
      state: updatedOrder.shippingAddress.state,
      country: "India",
    },

    // Tax details (dummy example)
    tax_details: [
      {
        cgst: "0.0",
        sgst: "0.0",
        igst: "0.0",
        total_tax: "0.0",
        sender_gstin: "22AAAAA0000A1Z4",
      },
    ],

    // Return details (optional)
    return_details: {
      name: "Udayaada",
      phone: "8123000558",
      address_line_1: "Thalaserry",
      address_line_2: "Post Palayad",
      pincode: "670102",
      city: "CANNANORE",
      state: "Kerala",
      country: "India",
    },

    // Pieces detail (optional granularity)
    pieces_detail: [
      {
        description: v.product.name,
        declared_value: v.product.offerPrice,
        volume: "100",
        weight: "0.25",
        height: "1",
        length: "1",
        width: "1",
        weight_unit: "kg",
        dimension_unit: "cm",
        volume_unit: "cm3",
        piece_product_code: `P-${Date.now()}`,
        reference_image_url: v.product.image || "",
      },
    ],
  }));

  // v2 expects the body as { consignments: [...] }
  const dtdcPayload = { consignments };

  const dtdcOptions = {
    method: "post",
    url: `https://dtdcapi.shipsy.io/api/customer/integration/consignment/softdata`,
    headers: {
      accept: "application/json",
      "Content-Type": "application/json",
      "api-key": "17650e27594130e98548596eeb92aa",
    },
    data: dtdcPayload,
  };

  const dtdcRes = await axios.request(dtdcOptions);

  if (dtdcRes.data?.data?.[0]?.success) {
    await Order.findByIdAndUpdate(
      updatedOrder._id,
      {
        $set: {
          dtdc: {
            referenceNumber: dtdcRes.data.data[0].reference_number,
            customerReferenceNumber: dtdcRes.data.data[0].customer_reference_number,
          },
        },
      },
      { new: true }
    );
  } else {
    console.warn("DTDC integration failed:", dtdcRes.data);
  }
} catch (dtdcErr) {
  console.error("DTDC API Error (v2):", dtdcErr);
}

    }
    

    return NextResponse.json({
      success: true,
      status: phonePeState,
      paymentStatus,
      transactionId,
      order: updatedOrder,
      email: emailResponse || { success: false, message: "Email not sent (payment not successful)" },
    });

  } catch (error: any) {
    console.error("Payment status check error:", error);
    return NextResponse.json(
      { error: "Status check failed", details: error.message },
      { status: 500 }
    );
  }
}
