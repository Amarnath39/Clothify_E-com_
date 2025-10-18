import { NextRequest, NextResponse } from "next/server";
import Product from "../../../../model/Product";
import Order from "../../../../model/Order";
import "../../../../model/User";
import { connectDB } from "../../../../../db";
// import Stripe from "stripe";
import {
  OrderDetails,
  sendAdminOrderEmail,
} from "../../../../helper/sendAdminOrderEmail";
import { sendUserOrderEmail } from "../../../../helper/sendUserOrderEmail";
import User from "../../../../model/User";
import axios from "axios";
import crypto from "crypto";
import { getShiprocketToken } from "../../hook/phonepe/payment-status/[orderId]/shiprocketToken";

connectDB();
// const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY as string);
export const POST = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, msg: "Please provide Admin Id" },
        { status: 400 }
      );
    }
    const admin = await User.findById(userId);
    if (!admin) {
      return NextResponse.json(
        { success: false, msg: "Unauthorized" },
        { status: 401 }
      );
    }
    const { id } = params;
    const body = await req.json();

    const { transactionId } = body;
    // const { payment_intent } = body;
    if (!id || !transactionId) {
      return NextResponse.json(
        { success: false, msg: "Invalid input" },
        { status: 400 }
      );
    }
    // const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent);
    // const paymentMethod = await stripe.paymentMethods.retrieve(
    //   paymentIntent.payment_method as string
    // );

    const xVerify = crypto
      .createHash("sha256")
      .update(
        `/pg/v1/status/${process.env.MERCHANT_ID_PROD}/${transactionId}` +
          process.env.SALT_KEY_PROD
      )
      .digest("hex");
    const checksum = xVerify + "###" + process.env.SALT_KEY_INDEX;

    const options = {
      method: "get",
      url: `${process.env.PHONE_PE_HOST_PROD}/pg/v1/status/${process.env.MERCHANT_ID_PROD}/${transactionId}`,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-MERCHANT-ID": process.env.MERCHANT_ID_PROD,
        "X-VERIFY": checksum,
      },
    };

    const response = await axios.request(options);

    const order = await Order.findById(id).populate([
      "user",
      "productDetails.product",
    ]);

    if (!order) {
      return NextResponse.json(
        { success: false, msg: "Order not found" },
        { status: 404 }
      );
    }

    // Update the order
    //order.transactionId = response.data?.data?.transactionId || transactionId;
    order.paymentStatus = response.data?.code || "STATUS_UNAVAILABLE";

    if (response?.data?.code === "PAYMENT_SUCCESS") {
      // Find the order by ID

      order.paymentMethod = response.data?.data?.paymentInstrument?.type;
      order.transactionId = response.data?.data?.transactionId;
      // order.transactionId = paymentIntent.id;
      // order.paymentStatus = paymentIntent.status;
      // order.paymentMethod = paymentMethod.type;

      await order.save();

      // Increment sell count for each product in the order
      // for (const productDetail of order.productDetails) {
      //   await Product.findByIdAndUpdate(productDetail.product, {
      //     $inc: {
      //       sellCount: productDetail.count + productDetail.freeCount,
      //       stock: -(productDetail.count + productDetail.freeCount),
      //     },
      //   });
      // }

      // Send Email
      const orderDetails: OrderDetails = {
        orderId: order?.orderId,
        customerName: order?.shippingAddress?.name,
        customerEmail: order?.user?.email,
        totalAmount: order?.payablePrice,
        orderDate: new Date(order?.updatedAt).toLocaleString().split(",")[0],
      };

      await sendUserOrderEmail(order);
      await sendAdminOrderEmail(orderDetails);

      // shiprocket integration

      // try {
      //   const shiprocketToken = await getShiprocketToken();
      //   if (!shiprocketToken) throw new Error("Failed to get Shiprocket token");

      //   const shiprocketPayload = {
      //     order_id: order.orderId,
      //     order_date: order.date,
      //     pickup_location: "primary",
      //     channel_id: "",
      //     comment: "",
      //     billing_customer_name: order?.user?.name,
      //     billing_last_name: "",
      //     billing_address: order?.shippingAddress?.address,
      //     billing_address_2: "",
      //     billing_city: order?.shippingAddress?.city,
      //     billing_pincode: order?.shippingAddress?.zipCode,
      //     billing_state: order?.shippingAddress?.state,
      //     billing_country: order?.shippingAddress?.country,
      //     billing_email: order?.user?.email,
      //     billing_phone: order?.user?.phone,
      //     shipping_is_billing: true,
      //     shipping_customer_name: order?.shippingAddress?.name,

      //     shipping_address: order?.shippingAddress?.address,
      //     shipping_city: order?.shippingAddress?.city,
      //     shipping_pincode: order?.shippingAddress?.zipCode,
      //     shipping_country: order?.shippingAddress?.country,
      //     shipping_state: order?.shippingAddress?.state,
      //     shipping_email: order?.user?.email,
      //     shipping_phone: order?.user?.phone,
      //     order_items: order?.productDetails?.map((detail) => ({
      //       name: detail?.product.name,
      //       sku: detail?.product.sku,
      //       units: detail?.count,
      //       selling_price: detail?.size?.offerPrice,
      //     })),
      //     payment_method: "Prepaid",
      //     shipping_charges: 0,
      //     giftwrap_charges: 0,
      //     transaction_charges: 0,
      //     total_discount: 0,
      //     sub_total: order?.payablePrice,
      //     length: 10,
      //     breadth: 15,
      //     height: 20,
      //     weight: 2.5,
      //   };
      //   console.log(shiprocketPayload, "shiprocketPayload");
      //   const shiprocketOptions = {
      //     method: "POST",
      //     url: `${process.env.SHIPROCKET_API_URL}/orders/create/adhoc`, // Replace with actual Shiprocket API endpoint
      //     headers: {
      //       "Content-Type": "application/json",
      //       Authorization: `Bearer ${shiprocketToken}`, // Ensure you have the correct Shiprocket API token
      //     },
      //     data: shiprocketPayload,
      //   };
      //   const shiprocketResponse = await axios.request(shiprocketOptions);

      //   console.log(shiprocketResponse, "shiprocket::");
      //   if (shiprocketResponse) {
      //     order.shiprocket = shiprocketResponse?.data;
      //   }
      // } catch (error) {}

      await order.save();

      return NextResponse.json(
        { success: true, msg: "Order updated successfully", order },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: false, msg: "Payment Pending", order },
      { status: 500 }
    );
  } catch (error) {
    console.log("Error to update order", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const PUT = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;
    if (!id)
      return NextResponse.json(
        { success: false, msg: "Please provide an id" },
        { status: 400 }
      );
    const order = await Order.findByIdAndUpdate(
      id,
      { $set: { currentStatus: "Cancelled" } },
      { new: true }
    );
    if (!order)
      return NextResponse.json(
        { success: false, msg: "Order not found" },
        { status: 404 }
      );
    return NextResponse.json(
      { success: true, msg: "Success", order },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error to cancel order", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};
