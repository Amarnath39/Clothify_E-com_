// src/app/api/coupon/[code]/route.ts
import { NextRequest, NextResponse } from "next/server";
import Coupon from "../../../../model/Coupon";
import { connectDB } from "../../../../../db";

connectDB();

export const POST = async (
  req: NextRequest, 
  { params }: { params: Promise<{ code: string }> }
) => {
  try {
    const { code } = await params;
    const { totalPrice } = await req.json();

    // Find coupon (case-insensitive)
    const coupon: any = await Coupon.findOne({
      couponCode: code.toUpperCase(),
    });

    if (!coupon) {
      return NextResponse.json(
        { success: false, msg: "Coupon not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    let isValid = true;
    let errorMsg = "";

    // Check expiry - coupon valid until end of day (23:59:59)
    if (!coupon.validity) {
      isValid = false;
      errorMsg = "Coupon has no validity date";
    } else {
      const validityDate = new Date(coupon.validity);
      validityDate.setHours(23, 59, 59, 999);
      if (validityDate < now) {
        isValid = false;
        errorMsg = "Coupon has expired";
      }
    }
    // Check usage limit
    if (isValid && coupon.userCount >= coupon.availableFor) {
      isValid = false;
      errorMsg = "Coupon usage limit reached";
    }
    // Check minimum purchase
    if (isValid && totalPrice < coupon.purchaseAmount) {
      isValid = false;
      errorMsg = `Minimum purchase of ₹${coupon.purchaseAmount} required`;
    }

    return NextResponse.json(
      {
        success: true,
        coupon: {
          ...coupon.toObject(),
          isValid,
          errorMsg,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Error validating coupon:", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";