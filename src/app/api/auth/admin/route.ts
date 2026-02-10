import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../db";
import Admin from "../../../../../src/model/Admin";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { decrypt } from "../../../../../src/lib/encryption";
import { verifyToken } from "../../../../../src/lib/twofa";
var cookie = require("cookie");

connectDB();

export const POST = async (req: NextRequest) => {
  try {
    const { email, password, otp } = await req.json();

    console.log("📩 Incoming login request:", { email, hasOtp: !!otp });

    // Find admin by email
    const admin = await Admin.findOne({ email });
    console.log("🔍 Admin lookup result:", admin);

    if (!admin) {
      console.warn("⚠️ Admin not found for email:", email);
      return NextResponse.json(
        { success: false, msg: "Admin not found!" },
        { status: 404 }
      );
    }

    // Check password
    const isMatch = await bcrypt.compare(password, admin.password);
    console.log("🔐 Password match result:", isMatch);

    if (!isMatch) {
      console.warn("❌ Invalid password for:", email);
      return NextResponse.json(
        { success: false, msg: "Invalid credentials" },
        { status: 401 }
      );
    }

    // 2FA Check
    if (admin.twoFA && admin.twoFA.enabled) {
      if (!otp) {
        console.log("🔒 2FA required for:", email);
        return NextResponse.json({ success: true, requires2FA: true });
      }

      const secret = decrypt(admin.twoFA.secret);
      const valid = verifyToken(secret, otp);

      if (!valid) {
        console.warn("❌ Invalid OTP for:", email);
        return NextResponse.json(
          { success: false, msg: "Invalid OTP" },
          { status: 401 }
        );
      }
      console.log("🔓 2FA verified for:", email);
    }

    // Generate JWT
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "1d" }
    );

    console.log("✅ JWT generated successfully");

    // Cookie options
    const cookieOptions: any = {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1 * 24 * 60 * 60, // 1 day
      path: "/",
      domain: process.env.NODE_ENV === "production" ? "swaarasya.com" : "localhost",
    };

    console.log("🍪 Cookie options:", cookieOptions);

    return NextResponse.json(
      {
        success: true,
        msg: "Login successful",
        token,
        id: admin._id,
        user: {
          _id: admin._id,
          name: admin.name,
          role: admin.role,
          twoFA: {
            enabled: admin.twoFA?.enabled || false
          }
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
    console.error("❌ Error during admin login:");
    console.error("➡️ Message:", error.message);
    console.error("➡️ Name:", error.name);
    console.error("➡️ Stack Trace:", error.stack);
    console.error("➡️ Full Error Object:", JSON.stringify(error, null, 2));

    return NextResponse.json(
      {
        success: false,
        msg: "Internal Server Error",
        error: error.message, // Show message in response (optional)
      },
      { status: 500 }
    );
  }
};
