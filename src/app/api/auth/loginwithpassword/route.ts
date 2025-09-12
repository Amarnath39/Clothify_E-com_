import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { connectDB } from "../../../../../db";
import User from "../../../../../model/User";
import orderConfirmationEmail from "../../../../../helper/orderConfirmationEmail";
const cookie = require("cookie");

connectDB();

const JWT_SECRET = process.env.JWT_SECRET as string;

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    let { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, msg: "Email and password are required" },
        { status: 400 }
      );
    }

    // ✅ Handle dummy user
    if (email === "test@gmail.com" && password === "123456") {
      let dummyUser = await User.findOne({ email });

      if (!dummyUser) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        dummyUser = new User({
          email,
          password: hashedPassword,
          role: "User",
        });

        await dummyUser.save();

        // Optional welcome email
        await orderConfirmationEmail(
          dummyUser.email,
          "Welcome to Udayaada (Dummy Account)!",
          `<p>Hello,</p><p>Your test account has been created.</p>`
        );
      }

      const token = jwt.sign(
        { id: dummyUser._id, email: dummyUser.email, role: dummyUser.role },
        JWT_SECRET,
        { expiresIn: "30d" }
      );

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
        domain: process.env.NODE_ENV === "production"
          ? "udayaada.in"
          : "localhost",
      };

      return NextResponse.json(
        {
          success: true,
          msg: "Dummy login successful",
          token,
          user: {
            id: dummyUser._id,
            email: dummyUser.email,
            phone: dummyUser.phone || null,
            role: dummyUser.role,
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

    // 🔒 Handle regular users
    let user = await User.findOne({ email });

    if (!user) {
      // Auto-register
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = new User({
        email,
        password: hashedPassword,
        role: "User",
      });

      await user.save();

      await orderConfirmationEmail(
        user.email,
        "Welcome to Roop Sagar!",
        `<p>Hello,</p><p>Your account has been created automatically.</p>`
      );
    } else {
      // Verify password
      if (!user.password) {
        return NextResponse.json(
          { success: false, msg: "Password not set for this account." },
          { status: 401 }
        );
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return NextResponse.json(
          { success: false, msg: "Invalid password" },
          { status: 401 }
        );
      }
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
      domain: process.env.NODE_ENV === "production"
        ? "www.udayaada.in"
        : "localhost",
    };

    return NextResponse.json(
      {
        success: true,
        msg: "Login successful",
        token,
        user: {
          id: user._id,
          email: user.email,
          phone: user.phone || null,
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
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};
