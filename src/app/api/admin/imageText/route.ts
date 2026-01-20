import { NextRequest, NextResponse } from "next/server";
import { uploadFile } from "../../../../helper/uploadFile";
import ImageText from "../../../../model/ImageText";
import { connectDB } from "../../../../../db";
import Admin from "../../../../model/Admin";

connectDB();

export const POST = async (req: NextRequest) => {
  try {
    const adminId = req.headers.get("x-admin-id");
    if (!adminId) {
      return NextResponse.json(
        { success: false, msg: "Please provide Admin Id" },
        { status: 400 }
      );
    }

    const admin = await Admin.findById(adminId);
    if (!admin || (admin.role !== "Admin" && admin.role !== "SuperAdmin")) {
      return NextResponse.json(
        { success: false, msg: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const url = formData.get("url") as string;

    // Extract files from specific fields
    const file1 = formData.get("files[0]") as File | null;
    const file2 = formData.get("files[1]") as File | null;

    // Check if at least one file is provided
    if (!file1) {
      return NextResponse.json(
        { success: false, msg: "Please provide at least one image file." },
        { status: 400 }
      );
    }

    const imgLinks: string[] = [];

    // Upload files
    const filesToUpload = [file1];
    if (file2) filesToUpload.push(file2);

    for (const file of filesToUpload) {
      const fileLink = await uploadFile("server/imageText", file);
      if (fileLink === null) {
        return NextResponse.json(
          { success: false, msg: "Failed to upload image" },
          { status: 500 }
        );
      }
      imgLinks.push(fileLink);
    }

    const imageText = await ImageText.create({
      img: imgLinks,
      title,
      description,
      url,
    });

    return NextResponse.json(
      { success: true, msg: "Created successfully", imageText },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.log("Error creating image text", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic"