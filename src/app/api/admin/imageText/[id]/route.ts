import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../../db";
import Admin from "../../../../../../model/Admin";
import ImageText from "../../../../../../model/ImageText";
import { uploadFile } from "../../../../../../helper/uploadFile";

connectDB();

export const PUT = async (req: NextRequest) => {
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
        const file1 = formData.get("files[0]") as File | null;
        const file2 = formData.get("files[1]") as File | null;
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const url = formData.get("url") as string;
        const imageTextId = formData.get("id") as string;

        if (!imageTextId) {
            return NextResponse.json(
                { success: false, msg: "ImageText ID is required" },
                { status: 400 }
            );
        }

        const imageText = await ImageText.findById(imageTextId);
        if (!imageText) {
            return NextResponse.json(
                { success: false, msg: "ImageText not found" },
                { status: 404 }
            );
        }

        if (file1 || file2) {
            const imgLinks: string[] = [];
            for (const file of [file1, file2]) {
                if (file) {
                    const fileLink = await uploadFile("server/imageText", file);
                    if (fileLink === null) {
                        return NextResponse.json(
                            { success: false, msg: "Failed to upload image" },
                            { status: 500 }
                        );
                    }
                    imgLinks.push(fileLink);
                }
            }
            if (imgLinks.length > 0) {
                imageText.img = imgLinks;
            }
        }

        if (title) {
            imageText.title = title;
        }

        if (description) {
            imageText.description = description;
        }

        if (url) {
            imageText.url = url;
        }

        await imageText.save();

        return NextResponse.json(
            { success: true, msg: "Updated successfully", imageText },
            {
                status: 200,
                headers: {
                    'Cache-Control': 'no-store, max-age=0'
                }
            }
        );
    } catch (error) {
        console.log("Error updating image text", error);
        return NextResponse.json(
            { success: false, msg: "Internal Server Error" },
            { status: 500 }
        );
    }
};

export const DELETE = async (req: NextRequest) => {
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

        const url = new URL(req.url);
        const imageTextId = url.pathname.split('/').pop();

        if (!imageTextId) {
            return NextResponse.json(
                { success: false, msg: "ImageText ID is required" },
                { status: 400 }
            );
        }

        const imageText = await ImageText.findByIdAndDelete(imageTextId);
        if (!imageText) {
            return NextResponse.json(
                { success: false, msg: "ImageText not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, msg: "Deleted successfully" },
            {
                status: 200,
                headers: {
                    'Cache-Control': 'no-store, max-age=0'
                }
            }
        );
    } catch (error) {
        console.log("Error deleting image text", error);
        return NextResponse.json(
            { success: false, msg: "Internal Server Error" },
            { status: 500 }
        );
    }
};

export const dynamic = "force-dynamic"