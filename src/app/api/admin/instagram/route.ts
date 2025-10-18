import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "../../../../helper/uploadFile";
import Instagram from "../../../../model/Instagram";
import { connectDB } from "../../../../../db";
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
        const file = formData.get("file") as File;
        const fileType = formData.get("fileType") as string;
        const url = formData.get("url") as string;

        if (!file) {
            return NextResponse.json(
                { success: false, msg: "No files received." },
                { status: 400 }
            );
        }

        //Upload image
        const fileLink = await uploadFile("server/instagram", file);
        if (fileLink === null)
            return NextResponse.json(
                { success: false, msg: "Internal Server Error" },
                { status: 500 }
            );

        const instagramDetails = await Instagram.create({
            fileLink,
            fileType,
            url,
        });

        return NextResponse.json(
            { success: true, msg: "Success", instagramDetails },
            {
                status: 201, headers: {
                    'Cache-Control': 'no-store, max-age=0'
                }
            }
        );
    } catch (error) {
        console.log("Error to post insta details", error);
        return NextResponse.json(
            { success: false, msg: "Internal Server Error" },
            { status: 500 }
        );
    }
};

export const dynamic = "force-dynamic"