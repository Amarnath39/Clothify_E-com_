// /app/api/auth/email/send-otp/route.ts
import { NextRequest, NextResponse } from "next/server";
import User from "../../../../../../model/User";
import { connectDB } from "../../../../../../db";
import orderConfirmationEmail from "../../../../../../helper/orderConfirmationEmail";

function generateOTP(length = 6): string {
  return Math.floor(100000 + Math.random() * 900000).toString().substring(0, length);
}

export const POST = async (req: NextRequest) => {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await connectDB();

    // ✅ Dummy account handling
    if (email === "test@gmail.com") {
      let user = await User.findOne({ email });

      if (!user) {
        user = new User({
          email,
          role: "User",
        });
        await user.save();
      }

      user.emailOtp = "123456"; // fixed dummy OTP
      user.emailOtpExpiry = Date.now() + 5 * 60 * 1000;
      await user.save();

      return NextResponse.json({
        message: "Dummy OTP set for test user",
        dummy: true,
        otp: "123456", // optionally return it for test clients
      });
    }

    // 🔄 Real user OTP flow
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        email,
        role: "User",
      });
      await user.save();
    }

    const otp = generateOTP();
    const expiry = Date.now() + 5 * 60 * 1000;

    user.emailOtp = otp;
    user.emailOtpExpiry = expiry;
    await user.save();

    const html = `<p>Your OTP for login is: <strong>${otp}</strong></p><p>This OTP will expire in 5 minutes.</p>`;
    await orderConfirmationEmail(email, "Your OTP for Login", html);

    return NextResponse.json({ message: "OTP sent to email successfully" });
  } catch (error: any) {
    console.error("Email OTP Send Error:", error);
    return NextResponse.json({ error: "Server Error", details: error.message }, { status: 500 });
  }
};
