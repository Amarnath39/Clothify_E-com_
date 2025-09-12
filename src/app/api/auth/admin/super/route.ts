// utils/initSuperAdmin.ts
import bcrypt from "bcryptjs";
import { connectDB } from "../../../../../../db";
import { NextRequest, NextResponse } from "next/server";
import Admin from "../../../../../../model/Admin";

// Connect to the database
connectDB();

export const POST = async (req: NextRequest) => {
    try {
        const existingAdmin = await Admin.findOne({ role: "SuperAdmin" });
        if (existingAdmin) {
            console.log("Super admin already exists");
            return NextResponse.json({ success: false, msg: "Super admin already exists" }, { status: 400 });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("12345678", salt);

        const superAdmin = new Admin({
            name: "Udayaada",
            email: "varnasuba755@gmail.com",
            password: hashedPassword,
            role: "SuperAdmin",
        });

        await superAdmin.save();
        console.log("Super admin created successfully");
        return NextResponse.json({success: true, msg: "Super admin created successfully", superAdmin}, {status: 201})
    } catch (error) {
        console.error("Error creating super admin", error);
        return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
    }
};

