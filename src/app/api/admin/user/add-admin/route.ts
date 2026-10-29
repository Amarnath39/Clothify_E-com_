import { NextRequest, NextResponse } from "next/server";
import Admin from "../../../../../model/Admin";
import { connectDB } from "../../../../../../db";
import bcrypt from "bcryptjs";

export const POST = async (req: NextRequest) => {
  try {
    await connectDB();
    const adminId = req.headers.get("x-admin-id");
    if (!adminId) {
      return NextResponse.json(
        { success: false, msg: "Please provide Admin Id" },
        { status: 400 }
      );
    }
    const adminCheck = await Admin.findById(adminId);
    if (!adminCheck || adminCheck.role !== "SuperAdmin") {
      return NextResponse.json(
        { success: false, msg: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, email, password, role } = body;

    // Find admin by email
    let admin = await Admin.findOne({ email });
    if (admin) {
      return NextResponse.json(
        { success: false, msg: "Admin already exist" },
        { status: 400 }
      );
    }
    // return NextResponse.json({ success: false, msg: "Admin not found" }, { status: 404 });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      role: role || "Admin",
    });
    return NextResponse.json(
      { success: true, msg: "Success", admin },
      { status: 201 }
    );
  } catch (error) {
    console.log("Error to add admin", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};
