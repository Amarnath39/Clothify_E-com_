import { NextRequest, NextResponse } from "next/server";
import Instagram from "../../../../../model/Instagram";
import { connectDB } from "../../../../../../db";
import Admin from "../../../../../model/Admin";

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
        const instagram = await Instagram.findByIdAndDelete(id);
        if (!instagram) {
            return NextResponse.json({ success: false, msg: "Insta not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, msg: "Success", instagram }, { status: 200 });
    } catch (error) {
        console.log("Error to delete Insta", error);
        return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
    }
}

export const dynamic = "force-dynamic"