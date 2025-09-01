import { NextRequest, NextResponse } from "next/server";
import User from "../../../../model/User";
import { sendEmail } from "../../../../helper/sendEmail";
import { sendOtp } from "../../../../helper/sendOtp";
import { connectDB } from "../../../../db";
import { generateOTP } from "../../../../helper/generateOTP";

connectDB();



export const POST = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const {email, role} = body;
        if (!email) return NextResponse.json({success: false, msg: "Please provide an email"}, {status: 400});

        // if(phone.length > 10) {
        //     phone.replace("+91", "");
        // }

        const otp = generateOTP();
        const otpExp = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

        let user = await User.findOne({email: email.toLowerCase()});
        if (!user) {
            user = new User({
                // phone: phone.toLowerCase(),
                email: email.toLowerCase(),
                otp,
                otpExp,
                role
            });
        }else {
            user.otp = otp;
            user.otpExp = otpExp;
        }

        await user.save();
        await sendEmail(email, otp);
        // await sendOtp(phone, otp.toString());

        return NextResponse.json({ success: true, msg: "OTP sent to email" }, {status: 200});
        
    } catch (error) {
        console.log("Error to login user", error);
        return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
    }
}