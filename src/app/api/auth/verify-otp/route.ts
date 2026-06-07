import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../db";
import User from "../../../../model/User";
import jwt from "jsonwebtoken";
import * as cookie from "cookie";
import { SerializeOptions } from "cookie";

connectDB();

const JWT_SECRET = process.env.JWT_SECRET as string;

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { email, otp } = body;
    if (!email || !otp)
      return NextResponse.json(
        { success: false, msg: "Please provide email and OTP" },
        { status: 400 }
      );

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, msg: "Invalid email or OTP" },
        { status: 404 }
      );
    }

    const currentTime = new Date();
    if (currentTime > user.otpExp) {
      return NextResponse.json(
        { success: false, msg: "Expired OTP" },
        { status: 400 }
      );
    } else if (user.otp === parseInt(otp) && user.otpExp > currentTime) {
      // OTP is valid, proceed with login
      // Clear the OTP and expiration time
      user.otp = null;
      user.otpExp = null;
      await user.save();

      // Sign a JWT token
      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        JWT_SECRET,
        {
          expiresIn: "30d",
        }
      );

      // Set the token in a cookie
      const cookieOptions: SerializeOptions = {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        // sameSite: 'none',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: "/",
        // domain: ".swaarasya.com", // Removed for local development
      };

      return new NextResponse(
        JSON.stringify({
          success: true,
          msg: "Login successful",
          id: user._id,
          token,
        }),
        {
          status: 200,
          headers: {
            "Set-Cookie": cookie.serialize("token", token, cookieOptions),
          },
        }
      );
    } else {
      return NextResponse.json(
        { success: false, msg: "Invalid OTP" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.log("Error to verify user", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};
