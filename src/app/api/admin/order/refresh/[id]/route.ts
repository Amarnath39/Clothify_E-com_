import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../../../db";
import Admin from "../../../../../../model/Admin";
import axios from "axios";
import crypto from "crypto";
import Order from "../../../../../../model/Order";

connectDB();

export const POST = async (
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
    const { transactionId } = body;

    if (!id || !transactionId) {
      return NextResponse.json(
        { success: false, msg: "Invalid input" },
        { status: 400 }
      );
    }

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

    // Find the order by ID
    const order = await Order.findById(id).populate(["user"]);
    if (!order) {
      return NextResponse.json(
        { success: false, msg: "Order not found" },
        { status: 404 }
      );
    }

    // if payment success then return no need to change the status
    if (order.paymentStatus === "PAYMENT_SUCCESS") {
      return NextResponse.json(
        {
          success: true,
          msg: "Order already successful, no refresh needed",
          order,
        },
        { status: 200 }
      );
    }

    // console.log(order, "order from admin");
    // console.log(response, "res:::");
    //order.transactionId = response.data?.data?.transactionId || transactionId;
    order.paymentStatus = response.data?.code || "STATUS_UNAVAILABLE";

    if (response?.data?.code === "PAYMENT_SUCCESS") {
      // Update the order
      order.paymentMethod = response.data?.data?.paymentInstrument?.type;
    }
    await order.save();

    return NextResponse.json(
      { success: true, msg: "Order refreshed successfully", order },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error to update order", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};

// import { NextRequest, NextResponse } from "next/server";
// import { connectDB } from "../../../../../../../db";
// import Admin from "../../../../../../../model/Admin";
// import axios from "axios";
// import crypto from "crypto";
// import Order from "../../../../../../../model/Order";

// connectDB();

// export const POST = async (
//   req: NextRequest,
//   { params }: { params: { id: string } }
// ) => {
//   try {
//     // const adminId = req.headers.get('x-admin-id');
//     // if (!adminId) {
//     //     return NextResponse.json({ success: false, msg: "Please provide Admin Id" }, { status: 400 });
//     // }
//     // const admin = await Admin.findById(adminId);
//     // if (!admin || (admin.role !== "Admin" && admin.role !== "SuperAdmin")) {
//     //     return NextResponse.json(
//     //         { success: false, msg: "Unauthorized" },
//     //         { status: 401 }
//     //     );
//     // }
//     // const { id } = params;
//     // const body = await req.json();
//     // const { transactionId } = body;

//     // if (!id || !transactionId) {
//     //     return NextResponse.json(
//     //         { success: false, msg: "Invalid input" },
//     //         { status: 400 }
//     //     );
//     // }

//     const currentDate = new Date();
//     currentDate.setDate(currentDate.getDate() - 1);
//     const orders = await Order.find({
//       paymentStatus: { $ne: "PAYMENT_SUCCESS" },
//       updatedAt: { $gte: currentDate },
//     });

//     orders.forEach(async (item) => {
//       const transactionId = item.tempTransactionId;

//       const xVerify = crypto
//         .createHash("sha256")
//         .update(
//           `/pg/v1/status/${process.env.MERCHANT_ID_PROD}/${transactionId}` +
//             process.env.SALT_KEY_PROD
//         )
//         .digest("hex");
//       const checksum = xVerify + "###" + process.env.SALT_KEY_INDEX;

//       const options = {
//         method: "get",
//         url: `${process.env.PHONE_PE_HOST_PROD}/pg/v1/status/${process.env.MERCHANT_ID_PROD}/${transactionId}`,
//         headers: {
//           accept: "application/json",
//           "Content-Type": "application/json",
//           "X-MERCHANT-ID": process.env.MERCHANT_ID_PROD,
//           "X-VERIFY": checksum,
//         },
//       };

//       const response = await axios.request(options);

//       // Find the order by ID
//       const order = await Order.findById(item._id).populate(["user"]);
//       if (!order) {
//         return NextResponse.json(
//           { success: false, msg: "Order not found" },
//           { status: 404 }
//         );
//       }

//       //order.transactionId = response.data?.data?.transactionId || transactionId;
//       order.paymentStatus = response.data?.code || "STATUS_UNAVAILABLE";

//       if (response?.data?.code === "PAYMENT_SUCCESS") {
//         // Update the order
//         order.paymentMethod = response.data?.data?.paymentInstrument?.type;
//       }
//       await order.save();
//     });
//     return NextResponse.json(
//       { success: true, msg: "Order refreshed successfully" },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.log("Error to update order", error);
//     return NextResponse.json(
//       { success: false, msg: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// };
