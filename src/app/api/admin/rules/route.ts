import { NextRequest, NextResponse } from "next/server";
import ReturnRules from "../../../../../model/ReturnRules";
import { connectDB } from "../../../../../db";
import Admin from "../../../../../model/Admin";

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
        const body = await req.json();
        if (body?.rule) {
            const rules = await ReturnRules.create({
                rule: body.rule
            });
            return NextResponse.json({ success: true, rules }, { status: 200 });
        } else {
            return NextResponse.json({ success: false, msg: "Rule shouldn't be empty" }, { status: 400 });
        }
    } catch (error) {
        console.log("Error to add rules", error);
        return NextResponse.json({ success: false, msg: "Internal server error" }, { status: 500 });
    }
}