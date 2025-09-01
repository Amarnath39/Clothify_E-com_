import { NextRequest, NextResponse } from "next/server";
import Coupon from "../../../../../model/Coupon";
import { connectDB } from "../../../../../db";

connectDB();

export const GET = async (req: NextRequest) => {
    try {
        const coupon = await Coupon.find();
        return NextResponse.json({ success: true, coupon }, { status: 200 });
    } catch (error) {
        console.log("Error to get all coupon", error);
        return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
    }
}

export const dynamic = "force-dynamic"