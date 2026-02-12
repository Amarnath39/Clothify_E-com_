import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../db";
import Admin from "../../../../../src/model/Admin";
import { decrypt } from "../../../../../src/lib/encryption";
import { verifyToken } from "../../../../../src/lib/twofa";

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

        const { token } = await req.json();
        if (!token) {
            return NextResponse.json({ success: false, msg: "Please provide OTP token" }, { status: 400 });
        }

        const secret = decrypt(admin.twoFA.tempSecret);
        const valid = verifyToken(secret, token);

        if (!valid) {
            return NextResponse.json({ success: false, msg: "Invalid OTP" }, { status: 400 });
        }

        admin.twoFA.secret = admin.twoFA.tempSecret;
        admin.twoFA.tempSecret = null;
        admin.twoFA.enabled = true;
        await admin.save();

        return NextResponse.json({ success: true, msg: "2FA enabled" });
    } catch (error) {
        console.error("Error verifying 2FA:", error);
        return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
    }
}
