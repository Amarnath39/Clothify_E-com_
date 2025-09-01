import { NextRequest, NextResponse } from "next/server";
import Admin from "../../../../../../model/Admin";
import { connectDB } from "../../../../../../db";
import ZoomData from "../../../../../../model/ZoomData";
import { uploadFile } from "../../../../../../helper/uploadFile";
connectDB();

export const PATCH = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
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
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    // const zoomDataId = formData.get("id") as string;
    const zoomDataId = params.id;

    if (!zoomDataId) {
      return NextResponse.json(
        { success: false, msg: "ZoomData ID is required" },
        { status: 400 }
      );
    }

    const zoomData = await ZoomData.findById(zoomDataId);
    if (!zoomData) {
      return NextResponse.json(
        { success: false, msg: "ZoomData not found" },
        { status: 404 }
      );
    }

    if (file) {
      const fileLink = await uploadFile("server/zoomData", file);
      if (fileLink === null) {
        return NextResponse.json(
          { success: false, msg: "Internal Server Error" },
          { status: 500 }
        );
      }
      zoomData.img = fileLink;
    }

    if (title) {
      zoomData.title = title;
    }

    await zoomData.save();

    return NextResponse.json(
      { success: true, msg: "Updated successfully", zoomData },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.log("Error updating zoom data", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic"