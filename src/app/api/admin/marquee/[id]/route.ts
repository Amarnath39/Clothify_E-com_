import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../../db";
import MarqueeEntry from "@/model/MarqueeEntry";

connectDB();

export const PATCH = async (req: NextRequest, { params }: { params: { id: string } }) => {
    try {
        const { text } = await req.json();
        const { id } = params;

        if (!text) {
            return NextResponse.json({ success: false, msg: "Text is required" }, { status: 400 });
        }

        const updatedEntry = await MarqueeEntry.findByIdAndUpdate(
            id,
            { text },
            { new: true }
        );

        if (!updatedEntry) {
            return NextResponse.json({ success: false, msg: "Entry not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, msg: "Entry updated successfully", entry: updatedEntry });
    } catch (error) {
        console.error("Error updating marquee entry:", error);
        return NextResponse.json({ success: false, msg: "Failed to update entry" }, { status: 500 });
    }
};

export const DELETE = async (req: NextRequest, { params }: { params: { id: string } }) => {
    try {
        const { id } = params;
        const deletedEntry = await MarqueeEntry.findByIdAndDelete(id);

        if (!deletedEntry) {
            return NextResponse.json({ success: false, msg: "Entry not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, msg: "Entry deleted successfully" });
    } catch (error) {
        console.error("Error deleting marquee entry:", error);
        return NextResponse.json({ success: false, msg: "Failed to delete entry" }, { status: 500 });
    }
};
