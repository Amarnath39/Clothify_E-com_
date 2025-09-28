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

      // ------------------ ✅ DTDC Integration with payablePrice ------------------
      try {
        const customerNo = `CUST${Date.now()}${Math.floor(Math.random() * 10000)}`;


        // Use `payablePrice` from order for declared & invoice values
        const consignments = updatedOrder.productDetails.map((v: any) => ({
          action_type: "single_pickup",
          consignment_type: "forward",
          movement_type: "forward",
          load_type: "NON-DOCUMENT",
          description: v.product.name,
          customer_code: "OO3609",
          reference_number: updatedOrder.orderId, // orderId from DB
          service_type_id: "B2C Priority",

          // COD logic
          cod_favor_of: updatedOrder.shippingAddress.name,
          cod_collection_mode: paymentStatus === "PAYMENT_SUCCESS" ? "prepaid" : "cash",
          cod_amount: paymentStatus === "PAYMENT_SUCCESS" ? 0 : updatedOrder.payablePrice,

          // Dimensions & weight
          dimension_unit: "cm",
          length: "1",
          width: "1",
          height: "1",
          weight_unit: "kg",
          weight: "0.25",
          num_pieces: v.count + (v.freeCount || 0),

          // Values (use payablePrice)
          declared_value: updatedOrder.payablePrice,
          invoice_amount: updatedOrder.payablePrice,
          invoice_number: updatedOrder.invoiceId || `INV-${Date.now()}`,
          invoice_date: new Date().toISOString().slice(0, 10),
          declared_value_without_tax: updatedOrder.payablePrice,
          customer_reference_number: customerNo,

          // Origin (your warehouse/store)
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

          // Destination (customer shippingAddress)
          destination_details: {
            name: updatedOrder.shippingAddress.name,
            phone: updatedOrder.shippingAddress.mobile,
            address_line_1: updatedOrder.shippingAddress.address,
            address_line_2: updatedOrder.shippingAddress.addressType || "",
            pincode: updatedOrder.shippingAddress.zipCode,
            city: updatedOrder.shippingAddress.city,
            state: updatedOrder.shippingAddress.state,
            country: updatedOrder.shippingAddress.country,
          },

          // Tax details
          tax_details: [
            {
              cgst: "0.0",
              sgst: "0.0",
              igst: "0.0",
              total_tax: "0.0",
              sender_gstin: "22AAAAA0000A1Z4",
            },
          ],

          // Return details (same as origin)
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

          // Pieces detail
          pieces_detail: [
            {
              description: v.product.name,
              declared_value: updatedOrder.payablePrice,
              volume: "100",
              weight: "0.25",
              height: "1",
              length: "1",
              width: "1",
              weight_unit: "kg",
              dimension_unit: "cm",
              volume_unit: "cm3",
              piece_product_code: v.product.sku || `P-${Date.now()}`,
              reference_image_url: v.product.img?.[0] || "",
            },
          ],
        }));

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
    // -------------------------------------------------------------------------------------

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
