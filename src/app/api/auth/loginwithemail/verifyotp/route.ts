import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import User from "../../../../../../model/User";
import { connectDB } from "../../../../../../db";
const cookie = require("cookie");

export const POST = async (req: NextRequest) => {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP required" }, { status: 400 });
    }

    await connectDB();

    let user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Dummy account shortcut
    if (email === "test@gmail.com") {
      if (otp !== "123456") {
        return NextResponse.json({ error: "Invalid OTP for dummy account" }, { status: 401 });
      }

      // No need to check expiry for dummy user
      user.emailOtp = undefined;
      user.emailOtpExpiry = undefined;
      await user.save();

      const token = jwt.sign(
        { id: user._id.toString(), email: user.email, role: user.role },
        process.env.JWT_SECRET || "temporarySecretForNow",
        { expiresIn: "1h" }
      );

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60,
        path: "/",
        domain: process.env.NODE_ENV === "production" ? "siskerala.com" : "localhost",
      };

      return NextResponse.json(
        {
          message: "Dummy login successful",
          token,
          user: {
            id: user._id,
            email: user.email,
            role: user.role,
          },
        },
        {
          status: 200,
          headers: {
            "Set-Cookie": cookie.serialize("token", token, cookieOptions),
          },
        }
      );
    }

    // 🔐 Real OTP verification for non-dummy users
    if (!user.emailOtp || !user.emailOtpExpiry) {
      return NextResponse.json({ error: "OTP not generated or expired" }, { status: 400 });
    }

    if (user.emailOtp !== otp || user.emailOtpExpiry < Date.now()) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 });
    }

    // Clear OTP fields
    user.emailOtp = undefined;
    user.emailOtpExpiry = undefined;
    await user.save();

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role },
      process.env.JWT_SECRET || "temporarySecretForNow",
      { expiresIn: "1h" }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60,
      path: "/",
      domain: process.env.NODE_ENV === "production" ? "siskerala.com" : "localhost",
    };

    return NextResponse.json(
      {
        message: "Login successful",
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
        },
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": cookie.serialize("token", token, cookieOptions),
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: "Server error", details: error.message },
      { status: 500 }
    );
  }
};
