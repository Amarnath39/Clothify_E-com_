import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../db";
import Admin from "../../../../../src/model/Admin";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
var cookie = require("cookie");

connectDB();

export const POST = async (req: NextRequest) => {
  try {
    const { email, password } = await req.json();

    console.log("📩 Incoming login request:", { email });

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
