import { NextRequest, NextResponse } from "next/server";
import Subscribe from "../../../model/Subscribe";
import { sendSubscribeEmail } from "../../../helper/sendSubscribeEmail";

export const POST = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const {email} = body;
        if (!email) {
            return NextResponse.json({ success: false, msg: "Please provide an email" }, { status: 400 });
        }
        const checkEmail = await Subscribe.findOne({email: email});
        if(checkEmail) return NextResponse.json({ success: false, msg: "Email already exist" }, { status: 400 });
        const subscribe = await Subscribe.create({email});
        await sendSubscribeEmail(email);
        return NextResponse.json({ success: true, msg: "Success", subscribe }, { status: 201 });
    } catch (error) {
        console.log("Error to subscribe", error);
        return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
    }
}