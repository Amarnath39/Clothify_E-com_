import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../../db";
import ReturnRules from "../../../../../model/ReturnRules";
import Admin from "../../../../../model/Admin";

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
        const returnRules = await ReturnRules.findByIdAndDelete(id);
        if (!returnRules) {
            return NextResponse.json({ success: false, msg: "rules not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, msg: "Success", returnRules }, { status: 200 });
    } catch (error) {
        console.log("Error to delete rules", error);
        return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
    }
}