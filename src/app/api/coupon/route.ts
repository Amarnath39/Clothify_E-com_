import { NextRequest, NextResponse } from "next/server";
import Coupon from "../../../model/Coupon";
import { connectDB } from "../../../../db";

connectDB();

export const GET = async (req: NextRequest) => {
    try {
        const coupons = await Coupon.find({visible: true});
        return NextResponse.json({ success: true, msg: "Success", coupons }, { status: 200 });
    } catch (error) {
        console.log("Error to get coupon details", error);
        return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
    }
}

export const dynamic = "force-dynamic"