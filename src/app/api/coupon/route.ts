// src/app/api/coupon/route.ts
import { NextRequest, NextResponse } from "next/server";
import Coupon from "../../../model/Coupon";
import { connectDB } from "../../../../db";

connectDB();

export const GET = async (req: NextRequest) => {
  try {
    const now = new Date();

    // Get current user ID from request headers or auth middleware
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, msg: "User not authenticated" },
        { status: 401 }
      );
    }

    // console.log("🔍 User ID from header:", userId);

    // ✅ Use OLD field name: visible
    const coupons = await Coupon.find({ visible: true });
    // console.log("👁️ Visible coupons found:", coupons.length);

    // Filter only valid coupons
    const validCoupons = coupons.filter((coupon) => {
      // Set validity to end of day (23:59:59) so coupon is valid for entire day
      const validityDate = new Date(coupon.validity);
      validityDate.setHours(23, 59, 59, 999);
      const isValidDate = coupon.validity && validityDate >= now;
      const hasUsageLeft = coupon.userCount < coupon.availableFor;

      // ✅ Single-user check
      const userHasUsed = !coupon.multiUse && coupon.user.includes(userId);

      console.log(`Coupon ${coupon.couponCode}:`, {
        isValidDate,
        hasUsageLeft,
        multiUse: coupon.multiUse,
        userHasUsed,
        validity: coupon.validity,
        currentUsage: coupon.userCount,
        maxUsage: coupon.availableFor,
      });

      return isValidDate && hasUsageLeft && !userHasUsed;
    });

    // console.log("✅ Valid coupons being sent:", validCoupons.length);

    return NextResponse.json(
      { success: true, msg: "Success", coupons: validCoupons },
      { status: 200 }
    );
  } catch (error) {
    // console.log("❌ Error fetching coupon details:", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic";