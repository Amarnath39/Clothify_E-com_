import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../db";
import Admin from "../../../../../src/model/Admin";

export const POST = async (req: NextRequest) => {
    try {
        await connectDB();
        const adminId = req.headers.get('x-admin-id');
        if (!adminId) {
            return NextResponse.json({ success: false, msg: "Please provide Admin Id" }, { status: 400 });
        }
        const admin = await Admin.findById(adminId);
        if (!admin || (admin.role !== "Admin" && admin.role !== "SuperAdmin")) {
            return NextResponse.json(
                { success: false, msg: "Unauthorized" },
                { status: 401 }
            );
        }

        admin.twoFA = {
            enabled: false,
            secret: null,
            tempSecret: null
        };
        await admin.save();

        return NextResponse.json({ success: true, msg: "2FA Disabled" });
    } catch (error) {
        console.error("Error disabling 2FA:", error);
        return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
    }
}
