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

    const html = `
  <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
      
      <div style="background: #004aad; color: #ffffff; padding: 20px; text-align: center;">
        <h2 style="margin: 0; font-size: 22px;">Login Verification</h2>
      </div>
      
      <div style="padding: 25px; color: #333333;">
        <p style="font-size: 16px; margin-bottom: 20px;">
          Dear User,
        </p>
        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
          Please use the following One-Time Password (OTP) to complete your login process:
        </p>
        
        <div style="text-align: center; margin: 25px 0;">
          <span style="font-size: 28px; font-weight: bold; letter-spacing: 3px; background: #f4f6fb; padding: 15px 25px; border-radius: 6px; border: 1px solid #ddd; display: inline-block;">
            ${otp}
          </span>
        </div>
        
        <p style="font-size: 14px; color: #555;">
          ⚠️ This OTP will expire in <strong>5 minutes</strong>.  
          If you did not request this, please ignore this email.
        </p>
      </div>
      
      <div style="background: #f1f1f1; text-align: center; padding: 15px; font-size: 12px; color: #777;">
        © ${new Date().getFullYear()} Your Company. All rights reserved.
      </div>
    </div>
  </div>
`;

    await orderConfirmationEmail(email, "Your OTP for Login", html);

    return NextResponse.json({ message: "OTP sent to email successfully" });
  } catch (error: any) {
    console.error("Email OTP Send Error:", error);
    return NextResponse.json({ error: "Server Error", details: error.message }, { status: 500 });
  }
};
