import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../db";
import Admin from "../../../../../src/model/Admin";
import { generateSecret } from "../../../../../src/lib/twofa";
import { encrypt } from "../../../../../src/lib/encryption";

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

        const { base32, qr } = await generateSecret(admin.email);

        admin.twoFA.tempSecret = encrypt(base32);
        await admin.save();

        return NextResponse.json({ success: true, qr, manualKey: base32 });
    } catch (error) {
        console.error("Error setting up 2FA:", error);
        return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
    }
}
