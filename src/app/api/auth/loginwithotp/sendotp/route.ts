import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import User from "../../../../../../model/User";
import { connectDB } from "../../../../../../db";

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    await connectDB();

    let user = await User.findOne({ phone });

    // ✅ Auto-register if user not found
    if (!user) {
      user = new User({
        phone,
        role: "User",
      });
      await user.save();
    }

    // ✅ Check for dummy phone number
    if (phone === "6543210123") {
      const dummySessionId = "dummy-session-id-12345";
      user.otpSessionId = dummySessionId;
      await user.save();

      return NextResponse.json({
        message: "OTP sent successfully (dummy)",
        sessionId: dummySessionId,
      });
    }

    const API_KEY = "c5837917-42b5-11f0-a562-0200cd936042";
    const VAR1 = encodeURIComponent(user.full_name || "Siskerala");
    const url = `https://2factor.in/API/V1/${API_KEY}/SMS/${phone}/AUTOGEN/OTPlogin?var1=${VAR1}`;

    const response = await axios.get(url);

    if (response.data.Status === "Success") {
      const sessionId = response.data.Details;

      user.otpSessionId = sessionId;
      await user.save();

      return NextResponse.json({
        message: "OTP sent successfully",
        sessionId,
      });
    } else {
      return NextResponse.json({
        error: "Failed to send OTP",
        details: response.data,
      }, { status: 400 });
    }
  } catch (err: any) {
    console.error("OTP Send Error:", err.response?.data || err.message);
    return NextResponse.json({ error: "Server error", details: err.message }, { status: 500 });
  }
};
