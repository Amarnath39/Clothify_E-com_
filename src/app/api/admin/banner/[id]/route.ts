import { NextRequest, NextResponse } from "next/server";
import Admin from "../../../../../model/Admin";
import { connectDB } from "../../../../../../db";
import HeroBanner from "../../../../../model/HeroBanner";
import { deleteFile } from "../../../../../helper/deleteFile";
import { uploadFile } from "../../../../../helper/uploadFile";

connectDB();

export const DELETE = async (req: NextRequest, { params }: { params: { id: string } }) => {
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
        const id = params.id;
        const banner = await HeroBanner.findByIdAndDelete(id);
        if (!banner) {
            return NextResponse.json({ success: false, msg: "Banner not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, msg: "Success", banner }, { status: 200 });
    } catch (error) {
        console.log("Error to delete banner", error);
        return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
    }
}

export const PATCH = async (req: NextRequest, { params }: { params: { id: string } }) => {
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
        const id = params.id;
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const mobileFile = formData.get('mobileFile') as File;
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const url = formData.get('url') as string;
        const position = formData.get('position') as string;
        let imgUrl: string | null = null;
        let mobileImgUrl: string | null = null;

        if (file) {
            // Delete existing desktop file
            const imgFile = await HeroBanner.findById(id).select(['img']);
            if (!imgFile) return NextResponse.json({ success: false, msg: "Banner not found" }, { status: 404 });
            await deleteFile(imgFile.img);
            // Upload new desktop file
            imgUrl = await uploadFile('server/banner', file);
        }

        if (mobileFile) {
            // Delete existing mobile file if exists
            const existingBanner = await HeroBanner.findById(id).select(['mobileImg']);
            if (existingBanner?.mobileImg) {
                await deleteFile(existingBanner.mobileImg);
            }
            // Upload new mobile file
            mobileImgUrl = await uploadFile('server/banner/mobile', mobileFile);
        }

        const newBanner: any = {};
        if (title) newBanner.title = title;
        if (description) newBanner.description = description;
        if (url) newBanner.url = url;
        if (position) newBanner.position = position;
        if (imgUrl && imgUrl !== null) newBanner.img = imgUrl;
        if (mobileImgUrl && mobileImgUrl !== null) newBanner.mobileImg = mobileImgUrl;
        const banner = await HeroBanner.findByIdAndUpdate(id, { $set: newBanner }, { new: true });
        if (!banner) {
            return NextResponse.json({ success: false, msg: "Banner not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, msg: "Success", banner }, { status: 200 });
    } catch (error) {
        console.log("Error to update banner", error);
        return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
    }
}


export const GET = async (req: NextRequest, { params }: { params: { id: string } }) => {
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
        const id = params.id;
        const banner = await HeroBanner.findById(id);
        if (!banner) {
            return NextResponse.json({ success: false, msg: "Banner not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, msg: "Success", banner }, { status: 200 });
    } catch (error) {
        console.log("Error to update banner", error);
        return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
    }
}

export const dynamic = "force-dynamic"