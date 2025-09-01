import { NextRequest, NextResponse } from "next/server";
import { generateOTP } from "../../../../helper/generateOTP";
import { connectDB } from "../../../../db";
import User from "../../../../model/User";
import "../../../../model/Address";
import { sendEmail } from "../../../../helper/sendEmail";

connectDB();

export const GET = async (req: NextRequest) => {
    try {
        const userId = req.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ success: false, msg: "Please provide User Id" }, { status: 400 });
        }
        const user = await User.findById(userId).populate(['address', 'defaultAddress']);
        if (!user) return NextResponse.json({ success: false, msg: "User not found" }, { status: 404 });
        return NextResponse.json({ success: true, msg: "Success", user }, { status: 200 });
    } catch (error) {
        console.log("Error to get user details ", error);
        return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
    }
}

export const PATCH = async (req: NextRequest) => {
    try {
        const userId = req.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ success: false, msg: "Please provide User Id" }, { status: 400 });
        }
        const user = await User.findById(userId);
        if (!user) return NextResponse.json({ success: false, msg: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { name, email, phone } = body;

        const newUser: any = {};

        // Update name and phone immediately
        if (name) newUser.name = name;
        if (phone) newUser.phone = phone; // Assuming `phone` is added to the user model

        // If email is being updated, store it in updateEmail field and send OTP
        if (email && email !== user.email) {
            newUser.email = email;
            // newUser.updateEmail = email;

            // Generate OTP
            // const otp = generateOTP();
            // const otpExp = new Date();
            // otpExp.setMinutes(otpExp.getMinutes() + 10); // OTP valid for 10 minutes

            // newUser.otp = otp;
            // newUser.otpExp = otpExp;

            // await user.save();
            // await User.findByIdAndUpdate(userId, { $set: newUser }, { new: true });

            // Send OTP to new email
            // await sendEmail(email, otp);

            // return NextResponse.json({ success: true, msg: "OTP sent to new email for verification." }, { status: 200 });
            // return NextResponse.json({ success: true, msg: "Profile updated successfully" }, { status: 200 });
        }

        // await user.save();
        await User.findByIdAndUpdate(userId, { $set: newUser }, { new: true });

        return NextResponse.json({ success: true, msg: "Profile updated successfully" }, { status: 200 });


    } catch (error) {
        console.log("Error to update user details ", error);
        return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
    }
}