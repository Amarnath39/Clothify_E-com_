import { getPhonePeClient } from "@/lib/phonepeClient";
import { NextResponse } from "next/server";
import Order from "../../../../../../model/Order";
import User from "../../../../../../model/User";
import { connectDB } from "../../../../../../db";
import { sendUserOrderEmail } from "../../../../../../helper/sendUserOrderEmail";
import mongoose from "mongoose";
import axios from "axios";
//import { generateRandomId } from "../../../../../../helper/generateRandomId";

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
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Get order
    const order = await Order.findOne({ tempTransactionId: orderId }).populate("productDetails.product");
    if (!order) {
      return NextResponse.json({ error: "Order not found in database" }, { status: 404 });
    }

    // Validate user
    if (!mongoose.Types.ObjectId.isValid(order.user)) {
      return NextResponse.json({ error: "Invalid userId in order" }, { status: 400 });
    }

    const user = await User.findById(order.user).lean<UserType>();
    if (!user || !user.email) {
      return NextResponse.json({ error: "User not found or missing email" }, { status: 404 });
    }

    // Call PhonePe API
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

    // Update order
    const updatedOrder = await Order.findOneAndUpdate(
      { tempTransactionId: orderId },
      { paymentStatus, transactionId, currentStatus },
      { new: true }
    ).populate("productDetails.product");

    let emailResponse: { success: boolean; message: string; error?: any } | null = null;

    if (paymentStatus === "PAYMENT_SUCCESS" && updatedOrder) {
      // Send confirmation email
      emailResponse = await sendUserOrderEmail({
        ...updatedOrder.toObject(),
        orderId: updatedOrder.orderId || updatedOrder._id.toString(),
        customerEmail: user.email,
      });

      // DTDC integration
      // DTDC integration
try {
  const dtdcPayload = {
    consignments: [
      {
        customer_code: "OO3609",
        load_type: "NON-DOCUMENT",
        service_type_id: "B2C Priority",
        dimension_unit: "cm",
        length: "1",
        width: "1",
        height: "1",
        weight_unit: "kg",
        weight: "0.25",
        description: "Cotton Shirt",       // exact value
        num_pieces: 2,                     // exact value
        declared_value: 500,               // exact value
        origin_details: {
          name: "Panchalivastra",
          phone: 8123000558,
          address_line_1: "Thalaserry",
          address_line_2: "Post Palayad",
          pincode: 670102,
          city: "CANNANORE",
          state: "Kerala"
        },
        destination_details: {
          name: "John Doe",
          phone: 9876543210,
          alternate_phone: "",
          address_line_1: "123, MG Road",
          address_line_2: "",
          pincode: 110078,
          city: "New Delhi",
          state: "Delhi"
        },
        customer_reference_number: "CUST1234567890",
        commodity_id: 99,
        reference_number: ""
      }
    ]
  };

  const dtdcRes = await axios.post(
    "https://dtdcapi.shipsy.io/api/customer/integration/consignment/softdata",
    dtdcPayload,
    {
      headers: {
        "api-key": "17650e27594130e98548596eeb92aa",
        "Content-Type": "application/json",
        Accept: "application/json",
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
  console.error("DTDC API Error:", dtdcErr?.response?.data || dtdcErr);
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
