import { NextRequest, NextResponse } from "next/server";
import Coupon from "../../../../model/Coupon";
import { connectDB } from "../../../../../db";

connectDB();

export const GET = async (
  req: NextRequest,
  { params }: { params: { code: string } }
) => {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json(
        { success: false, msg: "Please provide User Id" },
        { status: 400 }
      );
    }
    const couponCode = params.code;
    const url = new URL(req.url);
    const totalOfferPrice = url.searchParams.get("totalPrice");
    if (!couponCode || !totalOfferPrice) {
      return NextResponse.json(
        { success: false, msg: "Please provide Coupon Code" },
        { status: 400 }
      );
    }
    const coupon = await Coupon.findOne({ couponCode: couponCode });

    if (coupon) {
      const isValid =
        coupon.validity &&
        new Date(coupon.validity) > new Date() &&
        coupon.availableFor > coupon.userCount &&
        coupon.purchaseAmount <= totalOfferPrice;

      const hasUserUsedCoupon = coupon.user.includes(userId);
      const check = isValid && (!hasUserUsedCoupon || coupon.multiUse);

      const couponDetails = {
        ...JSON.parse(JSON.stringify(coupon)),
        isValid: check,
      };
      console.log(
        { success: true, msg: "Success", coupon: couponDetails },
        "details"
      );

      return NextResponse.json(
        { success: true, msg: "Success", coupon: couponDetails },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { success: false, msg: "Coupon not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.log("Error to get coupon details", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic"