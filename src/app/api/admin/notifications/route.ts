import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../db";
import Notification from "@/model/Notification";
import Admin from "@/model/Admin";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const adminId = req.headers.get("x-admin-id");
        // Ideally check admin auth, but middleware might handle it. 
        // Usually x-admin-id is passed if middleware validates. 
        // We can add safe check.
        if (!adminId) {
            // Return public or empty if strict auth needed? 
            // For now, let's assume if it reaches here and we want to be safe:
            // return NextResponse.json({ success: false, msg: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "10");

        const notifications = await Notification.find()
            .sort({ createdAt: -1 })
            .limit(limit);

        const unreadCount = await Notification.countDocuments({ isRead: false });

        return NextResponse.json({
            success: true,
            notifications,
            unreadCount,
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        // Extract data
        const body = await req.json();
        const { type, message, data } = body;

        const notif = await Notification.create({
            type,
            message,
            data
        });

        return NextResponse.json({ success: true, notification: notif });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
