import { NextRequest, NextResponse } from "next/server";
import User from "../../../../../model/User";
import { connectDB } from "../../../../../db";
import "../../../../../model/Address";

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
    const checkUser = await User.findById(userId);
    if (!checkUser) {
      return NextResponse.json(
        { success: false, msg: "Unauthorized" },
        { status: 401 }
      );
    }
    const body = await req.json();
    const { addressId } = body;
    if (!userId || !addressId)
      return NextResponse.json(
        { success: false, msg: "Bad Request" },
        { status: 400 }
      );
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { defaultAddress: addressId } },
      { new: true }
    );
    if (!user)
      return NextResponse.json(
        { success: false, msg: "User not found" },
        { status: 400 }
      );
    return NextResponse.json(
      { success: true, msg: "Success", user },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error to set default address", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};
