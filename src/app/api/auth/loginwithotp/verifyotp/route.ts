import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import jwt from "jsonwebtoken";
import User from "../../../../../model/User";
import { connectDB } from "../../../../../../db";
const cookie = require("cookie");

const JWT_SECRET = process.env.JWT_SECRET as string;

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { sessionId, otp } = body;

    if (!sessionId || !otp) {
      return NextResponse.json({ error: "Session ID and OTP are required" }, { status: 400 });
    }

    await connectDB();

    // ✅ Dummy logic: if sessionId matches demo, simulate success
    if (sessionId === "DEMO_SESSION_ID" && otp === "243648") {
      let user = await User.findOne({ otpSessionId: sessionId });

      // If not found, auto-create demo user
      if (!user) {
        user = new User({
          phone: "6543210123",
          role: "User",
          otpSessionId: sessionId,
        });
        await user.save();
      }

      // Clear session ID
      user.otpSessionId = undefined;
      await user.save();

      const token = jwt.sign(
        { id: user._id.toString(), role: user.role },
        JWT_SECRET,
        { expiresIn: "1d" }
      );

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 1 * 24 * 60 * 60, // 1 day
        path: "/",
        domain: process.env.NODE_ENV === "production" ? "swaarasya.com" : "localhost",
      };

      return NextResponse.json(
        {
          message: "Login successful (demo)",
          token,
          user: {
            id: user._id,
            phone: user.phone,
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

    // ✅ Real API verification for non-dummy session IDs
    const API_KEY = "c5837917-42b5-11f0-a562-0200cd936042";
    const url = `https://2factor.in/API/V1/${API_KEY}/SMS/VERIFY/${sessionId}/${otp}`;

    const response = await axios.get(url);

    if (response.data.Status === "Success" && response.data.Details === "OTP Matched") {
      let user = await User.findOne({ otpSessionId: sessionId });

      if (!user) {
        user = new User({
          otpSessionId: sessionId,
          role: "User",
        });
        await user.save();
      }

      user.otpSessionId = undefined;
      await user.save();

      const token = jwt.sign(
        { id: user._id.toString(), role: user.role },
        JWT_SECRET,
        { expiresIn: "1d" }
      );

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 1 * 24 * 60 * 60,
        path: "/",
        domain: process.env.NODE_ENV === "production" ? "siskerala.com" : "localhost",
      };

      return NextResponse.json(
        {
          message: "Login successful",
          token,
          user: {
            id: user._id,
            phone: user.phone,
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
    } else {
      return NextResponse.json(
        {
          error: "OTP verification failed",
          details: response.data,
        },
        { status: 401 }
      );
    }
  } catch (err: any) {
    console.error("OTP Verify Error:", err);
    return NextResponse.json({ error: "Server error", details: err.message }, { status: 500 });
  }
};
