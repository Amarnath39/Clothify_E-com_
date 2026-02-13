import ExportPreset from "@/model/ExportPreset";
import { connectDB } from "../../../../../db";
import { NextResponse } from "next/server";
import Admin from "@/model/Admin";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  await connectDB();
  try {
    const adminId = req.headers.get("x-admin-id");
    console.log("POST /api/admin/export-presets | adminId:", adminId);
    if (!adminId) {
      return NextResponse.json({ success: false, msg: "Please provide Admin Id" }, { status: 400 });
    }

    const body = await req.json();
    console.log("POST /api/admin/export-presets | body:", body);
    const preset = await ExportPreset.create(body);
    console.log("POST /api/admin/export-presets | Created preset:", preset);
    return NextResponse.json({ success: true, preset });
  } catch (error) {
    console.error("POST /api/admin/export-presets | Error:", error);
    return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  await connectDB();
  try {
    const adminId = req.headers.get("x-admin-id");
    console.log("GET /api/admin/export-presets | adminId:", adminId);
    if (!adminId) {
      return NextResponse.json({ success: false, msg: "Please provide Admin Id" }, { status: 400 });
    }

    const query = { createdBy: new mongoose.Types.ObjectId(adminId) };
    console.log("GET /api/admin/export-presets | query:", query);

    const rawPresets = await ExportPreset.find(query).sort({ createdAt: -1 }).lean();
    console.log(`GET /api/admin/export-presets | Found ${rawPresets.length} raw presets`);

    // Explicitly stringify IDs for robust frontend handling
    const presets = rawPresets.map((p: any) => ({
      ...p,
      _id: p._id.toString(),
      createdBy: p.createdBy.toString(),
    }));

    console.log(`GET /api/admin/export-presets | Found ${presets.length} stringified presets for admin ${adminId}`);
    return NextResponse.json({ success: true, presets });
  } catch (error) {
    console.error("GET /api/admin/export-presets | Error:", error);
    return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  await connectDB();
  try {
    const adminId = req.headers.get("x-admin-id");
    const { searchParams } = new URL(req.url);
    const presetId = searchParams.get("id");

    console.log("DELETE /api/admin/export-presets | adminId:", adminId, "presetId:", presetId);

    if (!adminId) {
      return NextResponse.json({ success: false, msg: "Please provide Admin Id" }, { status: 400 });
    }

    if (!presetId) {
      return NextResponse.json({ success: false, msg: "Please provide Preset Id" }, { status: 400 });
    }

    // Ensure the preset belongs to the admin or admin is superAdmin
    const preset = await ExportPreset.findById(presetId);
    if (!preset) {
      return NextResponse.json({ success: false, msg: "Preset not found" }, { status: 404 });
    }

    // Basic owner check
    if (preset.createdBy.toString() !== adminId) {
      // Optional: Check if admin is superAdmin to allow deletion of any preset
      const admin = await Admin.findById(adminId);
      if (!admin || (admin.role !== "SuperAdmin" && admin.role !== "Admin")) {
        return NextResponse.json({ success: false, msg: "Unauthorized to delete this preset" }, { status: 401 });
      }
    }

    await ExportPreset.findByIdAndDelete(presetId);
    console.log("DELETE /api/admin/export-presets | Deleted preset:", presetId);

    return NextResponse.json({ success: true, msg: "Preset deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/admin/export-presets | Error:", error);
    return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
  }
}
