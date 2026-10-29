import { NextRequest, NextResponse } from "next/server";
import HeroBanner from "../../../model/HeroBanner";
import { connectDB } from "../../../../db";

export const GET = async (req: NextRequest) => {
    try {
        await connectDB();
        const banners = await HeroBanner.find().sort('position');
        return NextResponse.json({ success: true, msg: "Success", banners }, { status: 200 });
    } catch (error) {
        console.log("Error to get banner", error);
        return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
    }
}

export const dynamic = "force-dynamic"