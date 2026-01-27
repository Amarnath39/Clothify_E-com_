import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../db";
import ScrollText from "@/model/ScrollText";

connectDB();

export const GET = async () => {
    try {
        const scrollText = await ScrollText.findOne();
        if (!scrollText) {
            return NextResponse.json({
                text: "Free Shipping all over India | Ships in 24 hours | ✨ New Arrivals Every Week",
                isVisible: true
            });
        }
        return NextResponse.json({
            text: scrollText.text,
            isVisible: scrollText.isVisible
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch scroll text" }, { status: 500 });
    }
};

export const POST = async (req: NextRequest) => {
    try {
        const { text, isVisible } = await req.json();
        let scrollText = await ScrollText.findOne();
        if (scrollText) {
            if (text !== undefined) scrollText.text = text;
            if (isVisible !== undefined) scrollText.isVisible = isVisible;
            await scrollText.save();
        } else {
            scrollText = new ScrollText({ text, isVisible: isVisible !== undefined ? isVisible : true });
            await scrollText.save();
        }
        return NextResponse.json({ success: true, msg: "Scroll text updated" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update scroll text" }, { status: 500 });
    }
};