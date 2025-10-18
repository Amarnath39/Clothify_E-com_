import { NextRequest, NextResponse } from "next/server";
import Order from "../../../../../../../model/Order";
import { sendUserOrderEmail } from "../../../../../../../helper/sendUserOrderEmail";
import {
  OrderDetails,
  sendAdminOrderEmail,
} from "../../../../../../../helper/sendAdminOrderEmail";
import Product from "../../../../../../../model/Product";
import axios from "axios";
import { getShiprocketToken } from "./shiprocketToken";

export const POST = async (
  req: NextRequest,
  { params }: { params: { orderId: string } }
) => {
  try {
    const { response } = await req.json();
    const { orderId } = params;

    if (!response) {
      console.log("No response in callback response");
      return NextResponse.json(
        { success: false, msg: "Not response in callback response" },
        { status: 400 }
      );
    }

    const order = await Order.findOne({ orderId });

    if (!order) {
      console.log(`No order found with orderId: ${orderId}`);
      return NextResponse.json(
        { success: false, msg: "Order not found" },
        { status: 404 }
      );
    }

    const decodedResponse = JSON.parse(atob(response) || "{}");

    // Sample for decoded response
    // {
    //    "success": true,
    //    "code": "PAYMENT_SUCCESS",
    //     "message": "Your request has been successfully completed.",
    //     "data": {
    //       "merchantId": "PGTESTPAYUAT",
    //       "merchantTransactionId": "MT7850590068188104",
    //       "transactionId": "T2111221437456190170379",
    //       "amount": 100,
    //       "state": "COMPLETED",
    //       "responseCode": "SUCCESS",
    //       "paymentInstrument": {
    //         "type": "UPI",
    //         "utr": "206378866112"
    //       }
    //     }
    //   }

    // TODO: Follow the same logic from /api/order/[id] down here
    if (decodedResponse?.code === "PAYMENT_SUCCESS") {
      // Find the order by ID
      order.paymentStatus = decodedResponse?.code || "STATUS_UNAVAILABLE";

      order.paymentMethod = decodedResponse?.data?.paymentInstrument?.type;
      order.transactionId = decodedResponse?.data?.transactionId;
      order.date = new Date();

      // Increment sell count for each product in the order
     for (const productDetail of order.productDetails) {
        const totalQuantityToDecrement =
          productDetail.count + (productDetail.freeCount || 0);

        // Update the Product document where the _id matches and an element
        // in the `sizes` array has a `size` field matching the one from the order.
        await Product.findOneAndUpdate(
          {
            _id: productDetail.product,
            "sizes.size": productDetail.size, // Target the specific size
          },
          {
            $inc: {
              // Increment the top-level sellCount for overall analytics
              sellCount: totalQuantityToDecrement,
              // Use the positional `$` operator to decrement the stock of the matched size
              "sizes.$.stock": -totalQuantityToDecrement,
            },
          }
        );
      }

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

    order.paymentStatus = decodedResponse?.code || "STATUS_UNAVAILABLE";

    await order.save();

    return NextResponse.json(
      { success: false, msg: "Payment Pending", order },
      { status: 500 }
    );
  } catch (error) {
    console.log("Error in hooks/phonepe/payment-status: ", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};
