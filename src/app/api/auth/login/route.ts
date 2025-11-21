import { NextRequest, NextResponse } from "next/server";

import jwt from "jsonwebtoken";
import * as cookie from "cookie";
import { connectDB } from "../../../../../db";
import User from "../../../../model/User";

connectDB();

const JWT_SECRET = process.env.JWT_SECRET as string;

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { phone, email } = body;
    if (!phone && !email)
      return NextResponse.json(
        { success: false, msg: "Please provide an phone" },
        { status: 400 }
      );
    let user;
    if (phone) {
      user = await User.findOne({ phone });
    } else {
      user = await User.findOne({ email });
    }
    if (!user) {
      user = new User({
        phone,
        email,
      });
    }

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
    const cookieOptions = {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
      domain: ".siskerala.com",
    };

    return new NextResponse(
      JSON.stringify({
        success: true,
        msg: "Login successful",
        id: user._id,
        // user: {
        //     name: user.name,
        //     email: user.email,
        // },
        token,
      }),
      {
        status: 200,
        headers: {
          "Set-Cookie": cookie.serialize("token", token, cookieOptions),
        },
      }
    );
  } catch (error) {
    console.log("Error to login user", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};
