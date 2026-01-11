import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../../db"; // Fixed depth
import Notification from "@/model/Notification";

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();
        const { id } = params;

        const notification = await Notification.findByIdAndUpdate(
            id,
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return NextResponse.json(
                { success: false, msg: "Notification not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, notification });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
