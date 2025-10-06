import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../db";
import Admin from "../../../../../model/Admin";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cookie from "cookie";

connectDB();

export const POST = async (req: NextRequest) => {
  try {
    const { email, password } = await req.json();

    // Find admin by email
    const admin = await Admin.findOne({ email });
    console.log({ admin });

    if (!admin) {
      return NextResponse.json(
        { success: false, msg: "Admin not found!" },
        { status: 404 }
      );
    }

    // Check password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, msg: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate JWT
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "30d" }
    );

    // ✅ Cookie options (works for both localhost and production)
    const cookieOptions: any = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 24 * 60 * 60, // 1 day
      path: "/",
      ...(process.env.NODE_ENV === "production"
        ? { domain: "siskerala.com" }
        : {}), // only set domain in production
    };

    // ✅ Send response with cookie
    return NextResponse.json(
      {
        success: true,
        msg: "Login successful",
        token,
        id: admin._id,
        user: {
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
  } catch (error) {
    console.error("Error during admin login:", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};
