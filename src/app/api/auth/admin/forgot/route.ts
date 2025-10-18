import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../../db";
import Admin from "../../../../../model/Admin";
import { sendEmail } from "../../../../../helper/sendEmail";
import bcrypt from 'bcryptjs';
import { generateOTP } from "../../../../../helper/generateOTP";

connectDB();
export const POST = async (req: NextRequest) => {
    try {
        const { email } = await req.json();

        // Find admin by email
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return NextResponse.json({ success: false, msg: "Admin not found" }, { status: 404 });
        }

        // Generate OTP and expiration time
        const otp = generateOTP(); // 6-digit OTP
        const otpExp = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

        admin.otp = otp;
        admin.otpExp = otpExp;
        await admin.save();

        // Send OTP via email (setup nodemailer)
        await sendEmail(email, otp);

        return NextResponse.json({ success: true, msg: "OTP sent to email" }, { status: 200 });

    } catch (error) {
        console.log("Error in forgot password", error);
        return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
    }
}


export const PATCH = async (req: NextRequest) => {
    try {
        const { email, otp, newPassword } = await req.json();

        // Find admin by email and OTP
        const admin = await Admin.findOne({ email, otp });
        if (!admin) {
            return NextResponse.json({ success: false, msg: "Invalid OTP or email" }, { status: 400 });
        }

        // Check if OTP is expired
        if (new Date() > admin.otpExp) {
            return NextResponse.json({ success: false, msg: "OTP expired" }, { status: 400 });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update admin password and clear OTP
        admin.password = hashedPassword;
        admin.otp = undefined;
        admin.otpExp = undefined;
        await admin.save();

        return NextResponse.json({ success: true, msg: "Password reset successfully" }, { status: 200 });
    } catch (error) {
        console.log("Error in reset password", error);
        return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
    }
}