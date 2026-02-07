import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../db";
import { uploadFile } from "../../../../helper/uploadFile";
import HeroBanner from "../../../../model/HeroBanner";
import Admin from "../../../../model/Admin";

connectDB();

export const POST = async (req: NextRequest) => {
    try {
        const adminId = req.headers.get('x-admin-id');
        if (!adminId) {
            return NextResponse.json({ success: false, msg: "Please provide Admin Id" }, { status: 400 });
        }
        const admin = await Admin.findById(adminId);
        if (!admin || (admin.role !== "Admin" && admin.role !== "SuperAdmin")) {
            return NextResponse.json(
                { success: false, msg: "Unauthorized" },
                { status: 401 }
            );
        }
        const formData = await req.formData();

        const file = formData.get('file') as File;
        const mobileFile = formData.get('mobileFile') as File;
        const type = formData.get('type') as string || "image";
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const url = formData.get('url') as string;
        const position = formData.get('position') || 0;

        if (!file) {
            return NextResponse.json({ success: false, msg: "No files received." }, { status: 400 });
        }

        //Upload desktop image
        const imgUrl = await uploadFile('server/banner', file);
        if (imgUrl === null) return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });

        // Upload mobile image (optional)
        let mobileImgUrl: string | null = null;
        if (mobileFile) {
            mobileImgUrl = await uploadFile('server/banner/mobile', mobileFile);
        }

        // Store in DB
        const banner = await HeroBanner.create({
            title,
            description,
            position,
            img: imgUrl,
            mobileImg: mobileImgUrl,
            type,
            url
        });

        return NextResponse.json({ success: true, msg: "Success", banner }, { status: 201 });

    } catch (error) {
        console.log("Error to create banner", error);
        return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
    }
}

export const dynamic = "force-dynamic"