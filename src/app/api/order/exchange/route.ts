import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../db";
import { uploadFile } from "../../../../../helper/uploadFile";
import Exchange from "../../../../../model/Exchange";
import Order from "../../../../../model/Order";
import User from "../../../../../model/User";

connectDB();

export const POST = async (req: NextRequest) => {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, msg: "Please provide User Id" },
        { status: 400 }
      );
    }
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, msg: "Unauthorized" },
        { status: 401 }
      );
    }
    const formData = await req.formData();
    const files = formData.getAll("file") as File[];
    const orderId = formData.get("orderId") as string;
    const reason = formData.get("reason") as string;

    if (!orderId)
      return NextResponse.json(
        { success: false, msg: "Please provide orderId" },
        { status: 400 }
      );

    const checkOrder = await Order.findById(orderId);
    if (!checkOrder)
      return NextResponse.json(
        { success: false, msg: "Order not found" },
        { status: 404 }
      );

    //Upload image
    const imgUrls: string[] = [];
    for (const file of files) {
      const imgUrl = await uploadFile("server/exchange", file);
      if (imgUrl === null)
        return NextResponse.json(
          { success: false, msg: "Internal Server Error" },
          { status: 500 }
        );
      imgUrls.push(imgUrl);
    }

    const exchange = await Exchange.create({
      orderId,
      reason,
      img: imgUrls,
    });

    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          exchangeReason: exchange._id,
          currentStatus: "Applied for exchange",
        },
      },
      { new: true }
    );

    return NextResponse.json(
      { success: true, msg: "Success", order },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error to exchange order", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};
