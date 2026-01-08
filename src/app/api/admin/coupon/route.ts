// src/app/api/admin/coupon/route.ts
import { NextRequest, NextResponse } from "next/server";
import Coupon from "../../../../model/Coupon";
import { connectDB } from "../../../../../db";
import Admin from "../../../../model/Admin";

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
      maxDiscount,      // ✅ ADDED: Extract maxDiscount from body
      purchaseAmount,
      visible,
      multiUse,
    } = body;

    // console.log("📝 Creating coupon:", {
    //   couponCode,
    //   type,
    //   amount,
    //   maxDiscount,
    // });

    const date = new Date(validity);

    // ✅ FIX: Prepare coupon data with proper maxDiscount handling
    const couponData: any = {
      couponCode: couponCode.toUpperCase(),
      validity: date,
      description: description || "",
      type,
      off: off || "0",
      availableFor,
      multiUse: multiUse || false,
      amount: parseFloat(amount),
      purchaseAmount: parseFloat(purchaseAmount) || 0,
      visible: visible || false,
      validOnCategories: categories || [],
    };

    // ✅ CRITICAL: Handle maxDiscount based on type
    if (type === "percentage") {
      // For percentage coupons, set maxDiscount if provided
      couponData.maxDiscount = maxDiscount !== undefined && maxDiscount !== "" && maxDiscount !== null
        ? parseFloat(maxDiscount) 
        : null;
    } else {
      // For flat coupons, always set to null
      couponData.maxDiscount = null;
    }

    // console.log("💾 Coupon data to save:", couponData);

    // Store in DB
    const coupon = await Coupon.create(couponData);

    // console.log("✅ Coupon created:", {
    //   id: coupon._id,
    //   code: coupon.couponCode,
    //   type: coupon.type,
    //   amount: coupon.amount,
    //   maxDiscount: coupon.maxDiscount,
    // });

    return NextResponse.json(
      { success: true, msg: "Success", coupon },
      { status: 201 }
    );
  } catch (error: any) {
    console.log("Error to create coupon", error);
    
    // Handle duplicate coupon code error
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, msg: "Coupon code already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";