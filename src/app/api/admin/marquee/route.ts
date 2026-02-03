import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../db";
import MarqueeEntry from "@/model/MarqueeEntry";

connectDB();

export const GET = async (req: NextRequest) => {
    try {
        const entries = await MarqueeEntry.find().sort({ createdAt: -1 });
        return NextResponse.json({ success: true, entries });
    } catch (error) {
        console.error("Error fetching marquee entries:", error);
        return NextResponse.json({ success: false, msg: "Failed to fetch entries" }, { status: 500 });
    }
};

export const POST = async (req: NextRequest) => {
    try {
        const { text } = await req.json();

        if (!text) {
            return NextResponse.json({ success: false, msg: "Text is required" }, { status: 400 });
        }

        const newEntry = await MarqueeEntry.create({ text });
        return NextResponse.json({ success: true, msg: "Entry created successfully", entry: newEntry });
    } catch (error) {
        console.error("Error creating marquee entry:", error);
        return NextResponse.json({ success: false, msg: "Failed to create entry" }, { status: 500 });
    }
};
