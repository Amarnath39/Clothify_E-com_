import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../db";
import Address from "../../../model/Address";
import User from "../../../model/User";

export const POST = async (req: NextRequest) => {
  try {
    await connectDB();
    const userId = req.headers.get("x-user-id");
    const body = await req.json();
    const {
      name,
      address,
      mobile,
      country,
      state,
      addressType,
      zipCode,
      city,
    } = body;

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

    // Store in DB
    const userAddress = await Address.create({
      name,
      address,
      mobile,
      country,
      state,
      addressType,
      zipCode,
      user: userId,
      city,
    });

    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { address: userAddress._id } },
      { new: true }
    );
    if (user.address.length === 1) {
      user.defaultAddress = userAddress._id;
      user.save();
    }

    return NextResponse.json(
      { success: true, msg: "Success", userAddress },
      { status: 201 }
    );
  } catch (error) {
    console.log("Error to add address ", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const GET = async (req: NextRequest) => {
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
    const addresses = await Address.find({ user: userId });
    return NextResponse.json(
      { success: true, msg: "Success", addresses },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error to get address ", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};
