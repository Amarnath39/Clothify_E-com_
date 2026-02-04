import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/../db";
import Category from "@/model/Category";

export const dynamic = "force-dynamic";

export const GET = async (req: NextRequest) => {
    try {
        await connectDB();
        const categories = await Category.find({}, "name gst childCategory").lean();

        // Filter to show only "Leaf" categories or Top categories?
        // User mentioned "Clothing" and "Jewellery". These are likely top categories.
        // We will send all.

        return NextResponse.json({ success: true, categories });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
};

export const PATCH = async (req: NextRequest) => {
    try {
        await connectDB();
        const { categoryId, gst } = await req.json();

        if (!categoryId || typeof gst !== "number") {
            return NextResponse.json({ success: false, message: "Invalid data" }, { status: 400 });
        }

        await Category.findByIdAndUpdate(categoryId, { gst });
        return NextResponse.json({ success: true, message: "GST updated" });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
};
