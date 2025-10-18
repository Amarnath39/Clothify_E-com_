import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../db";
import { uploadFile } from "../../../../helper/uploadFile";
import Category from "../../../../model/Category";
import Admin from "../../../../model/Admin";

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

    const formData = await req.formData();

    const file = formData.get("file") as File;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const categories = JSON.parse(
      (formData.get("categories") as string) || "[]"
    ) as string[];

    console.log(categories, "category");
    if (!file) {
      return NextResponse.json(
        { success: false, msg: "No files received." },
        { status: 400 }
      );
    }

    //Upload image
    const imgUrl = await uploadFile("server/category", file);
    if (imgUrl === null)
      return NextResponse.json(
        { success: false, msg: "Internal Server Error" },
        { status: 500 }
      );

    // Store in DB
    const category = await Category.create({
      name,
      description,
      img: imgUrl,
      parentCategory: categories,
    });

    categories.forEach(async (v) => {
      await Category.findByIdAndUpdate(v, {
        $push: { childCategory: category._id },
      });
    });

    return NextResponse.json(
      { success: true, msg: "Success", category },
      { status: 201 }
    );
  } catch (error) {
    console.log("Error to create category ", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const PATCH = async (req: NextRequest) => {
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
    const { categories }: { categories: string[] } = body;

    const updatedCategories = await Category.updateMany(
  { _id: { $in: categories } },
  [{ $set: { showInHome: { $not: "$showInHome" } } }]
  // ✅ remove the third argument or use valid options like `upsert`, `writeConcern`, etc.
);


    return NextResponse.json(
      { success: true, data: updatedCategories },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error to update categories ", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic"