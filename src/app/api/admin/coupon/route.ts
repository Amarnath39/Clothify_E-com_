import { NextRequest, NextResponse } from "next/server";
import Coupon from "../../../../../model/Coupon";
import { connectDB } from "../../../../../db";
import Admin from "../../../../../model/Admin";

connectDB();

export const POST = async (req: NextRequest) => {
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
    const body = await req.json();
    const {
      couponCode,
      description,
      categories,
      validity,
      type,
      off,
      availableFor,
      amount,
      purchaseAmount,
      visible,
      multiUse,
    } = body;

    const date = new Date(validity);

    // Store in DB
    const coupon = await Coupon.create({
      couponCode,
      validity: date,
      description,
      type,
      off,
      availableFor,
      multiUse,
      amount,
      purchaseAmount,
      visible,
      validOnCategories: categories,
    });

    return NextResponse.json(
      { success: true, msg: "Success", coupon },
      { status: 201 }
    );
  } catch (error) {
    console.log("Error to create coupon", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic"
