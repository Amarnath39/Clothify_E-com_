import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../db";
import ZoomData from "../../../model/ZoomData";

export const GET = async (req: NextRequest) => {
    try {
        await connectDB();
        const zoomDataList = await ZoomData.find({}).sort({ createdAt: -1 });

        return NextResponse.json(
            { success: true, zoomDataList },
            {
                status: 200, headers: {
                    'Cache-Control': 'no-store, max-age=0'
                }
            }
        );
    } catch (error) {
        console.log("Error fetching item data", error);
        return NextResponse.json(
            { success: false, msg: "Internal Server Error" },
            { status: 500 }
        );
    }
};

export const dynamic = "force-dynamic"