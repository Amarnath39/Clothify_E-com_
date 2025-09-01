import { NextRequest, NextResponse } from "next/server";
import Admin from "../../../../../model/Admin";
import { connectDB } from "../../../../../db";

connectDB();

export const GET = async (req: NextRequest) => {
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
    const users = await Admin.find();
    return NextResponse.json({ success: true, msg: "Success", users }, { status: 200 })
  } catch (error) {
    console.log("Error to get all user details", error);
    return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
  }
}


