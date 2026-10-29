import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../db";
import MarqueeEntry from "@/model/MarqueeEntry";

export const GET = async (req: NextRequest) => {
    try {
        await connectDB();
        // Fetch public entries, sorted by most recent
        const entries = await MarqueeEntry.find().sort({ createdAt: -1 });

        // Cache control: revalidate every 60 seconds
        return NextResponse.json(
            { success: true, entries },
            { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' } }
        );
    } catch (error) {
        console.error("Error fetching public marquee entries:", error);
        return NextResponse.json({ success: false, msg: "Failed to fetch entries" }, { status: 500 });
    }
};
