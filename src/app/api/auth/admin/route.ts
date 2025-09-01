import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../db";
import Admin from "../../../../../model/Admin";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
// import { cookie, CookieSerializeOptions } from "cookie";
var cookie = require("cookie");

connectDB();
export const POST = async (req: NextRequest) => {
  try {
    const { email, password } = await req.json();

    // Find admin by email
    let admin = await Admin.findOne({ email });
    console.log({admin})
    if (!admin) {
      return NextResponse.json(
        { success: false, msg: "Admin not found!" },
        { status: 404 }
      );
    } else {
      // Check if password matches
      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) {
        return NextResponse.json(
          { success: false, msg: "Invalid credentials" },
          { status: 401 }
        );
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET as string,
      { expiresIn: "30d" }
    );

    // Set the token in a cookie
    const cookieOptions: any = {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      // sameSite: "none",
      maxAge: 1 * 24 * 60 * 60, // 1 day
      path: "/",
      domain: process.env.NODE_ENV === "production" ? "roopsagarshoppingmall.com" : "localhost"
    };

    // return NextResponse.json({ success: true, token }, { status: 200 });
    return NextResponse.json(
      {
        success: true,
        msg: "Login successful",
        token: token,
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
    console.log("Error to get user details ", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};
