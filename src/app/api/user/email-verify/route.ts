import { NextRequest, NextResponse } from "next/server";
import User from "../../../../model/User";

export const POST = async (req: NextRequest) => {
  try {
    const userId = req.headers.get("x-user-id");
    console.log(userId, "userId");
    if (!userId) {
      return NextResponse.json(
        { success: false, msg: "Please provide User Id" },
        { status: 400 }
      );
    }
    const user = await User.findById(userId);
    if (!user)
      return NextResponse.json(
        { success: false, msg: "Unauthorized" },
        { status: 401 }
      );

    const body = await req.json();
    const { newEmail, otp } = body;

    if (!newEmail || !otp) {
      return NextResponse.json(
        { success: false, msg: "Please provide new email and OTP" },
        { status: 400 }
      );
    }

    const currentTime = new Date();
    if (
      currentTime > user.otpExp ||
      user.otp !== parseInt(otp) ||
      user.updateEmail !== newEmail
    ) {
      return NextResponse.json(
        { success: false, msg: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Update email and clear OTP fields
    user.email = newEmail;
    user.updateEmail = null;
    user.otp = null;
    user.otpExp = null;
    await user.save();

    return NextResponse.json(
      { success: true, msg: "Email updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error verifying OTP", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};
