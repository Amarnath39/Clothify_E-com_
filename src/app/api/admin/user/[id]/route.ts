import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../../db";
import Admin from "../../../../../../model/Admin";

connectDB();

export const DELETE = async (req: NextRequest, {params}: {params: {id: string}}) => {
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
        const delAdmin = await Admin.findByIdAndDelete(id);
        if (!delAdmin) {
            return NextResponse.json({ success: false, msg: "Admin not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, msg: "Success", delAdmin }, { status: 200 });
    } catch (error) {
        console.log("Error to delete Admin", error);
        return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
    }
}

export const PUT = async (req: NextRequest, {params}: {params: {id: string}}) => {
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
      const body = await req.json();
      const { role } = body;
      const id = params.id;
      if (!id) return NextResponse.json({ success: false, msg: "Please provide an userid" }, { status: 400 });
      const user = await Admin.findById(id);
      if (!user) return NextResponse.json({ success: false, msg: "User not found" }, { status: 404 });
      const newadmin = await Admin.findByIdAndUpdate(id, { $set: { role: role } }, { new: true });
      return NextResponse.json({ success: true, msg: "Success", user: newadmin }, { status: 200 });
    } catch (error) {
      console.log("Error to add admin", error);
      return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
    }
  }