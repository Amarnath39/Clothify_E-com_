// src/app/api/admin/coupon/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import Coupon from "../../../../../model/Coupon";
import Admin from "../../../../../model/Admin";
import { connectDB } from "../../../../../../db";

// =======================
// DELETE COUPON
// =======================
export const DELETE = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await connectDB();
    const { id } = await params;
    
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

    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return NextResponse.json(
        { success: false, msg: "Coupon not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, msg: "Success", coupon },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error to delete coupon", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};

// =======================
// UPDATE COUPON
// =======================
export const PATCH = async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    await connectDB();
    const { id } = await params;
    
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
    
    console.log("🔍 PATCH Request Body:", JSON.stringify(body, null, 2));

    const {
      couponCode,
      description,
      categories,
      validity,
      type,
      off,
      availableFor,
      amount,
      maxDiscount,
      purchaseAmount,
      visible,
      multiUse,
    } = body;

    // ✅ Get current coupon FIRST - use type assertion to fix TypeScript
    const currentCoupon: any = await Coupon.findById(id);
    if (!currentCoupon) {
      return NextResponse.json(
        { success: false, msg: "Coupon not found" },
        { status: 404 }
      );
    }

    console.log("📊 Current Coupon:", {
      type: currentCoupon.type,
      amount: currentCoupon.amount,
      maxDiscount: currentCoupon.maxDiscount
    });

    const updateCoupon: any = {};

    // Build update object for basic fields
    if (couponCode !== undefined) updateCoupon.couponCode = couponCode.toUpperCase();
    if (description !== undefined) updateCoupon.description = description;
    if (validity !== undefined) updateCoupon.validity = new Date(validity);
    if (type !== undefined) updateCoupon.type = type;
    if (off !== undefined) updateCoupon.off = off;
    if (availableFor !== undefined) updateCoupon.availableFor = Number(availableFor);
    if (amount !== undefined) updateCoupon.amount = Number(amount);
    if (purchaseAmount !== undefined) updateCoupon.purchaseAmount = Number(purchaseAmount);
    if (visible !== undefined) updateCoupon.visible = visible;
    if (multiUse !== undefined) updateCoupon.multiUse = multiUse;

    // Handle categories
    if (Array.isArray(categories)) {
      updateCoupon.validOnCategories = categories;
    }

    // ✅ CRITICAL: Determine final type
    const finalType = type !== undefined ? type : currentCoupon.type;
    
    console.log("🎯 Type Analysis:", {
      typeInRequest: type,
      currentType: currentCoupon.type,
      finalType: finalType,
      maxDiscountInRequest: maxDiscount
    });

    // ✅ CRITICAL FIX: Handle maxDiscount based on final type
    if (finalType === "percentage") {
      // For percentage coupons, handle maxDiscount explicitly
      if (maxDiscount !== undefined) {
        // User provided maxDiscount value
        if (maxDiscount === null || maxDiscount === "" || maxDiscount === 0) {
          // User wants to remove cap
          updateCoupon.maxDiscount = null;
          console.log("✅ Removing maxDiscount cap (set to null)");
        } else {
          // User set a cap value
          updateCoupon.maxDiscount = Number(maxDiscount);
          console.log("✅ Setting maxDiscount to:", Number(maxDiscount));
        }
      }
      // If not provided, don't update (keep existing value)
    } else {
      // For flat coupons, always clear maxDiscount
      updateCoupon.maxDiscount = null;
      console.log("✅ Clearing maxDiscount (flat coupon)");
    }

    console.log("💾 Final Update Object:", JSON.stringify(updateCoupon, null, 2));

    // Perform update
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id,
      updateCoupon,
      { 
        new: true, 
        runValidators: true
      }
    );

    if (!updatedCoupon) {
      return NextResponse.json(
        { success: false, msg: "Coupon not found after update" },
        { status: 404 }
      );
    }

    console.log("✅ Updated Coupon:", {
      _id: updatedCoupon._id,
      type: (updatedCoupon as any).type,
      amount: (updatedCoupon as any).amount,
      maxDiscount: (updatedCoupon as any).maxDiscount,
    });

    return NextResponse.json(
      { success: true, msg: "Coupon updated successfully", coupon: updatedCoupon },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Error updating coupon:", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";