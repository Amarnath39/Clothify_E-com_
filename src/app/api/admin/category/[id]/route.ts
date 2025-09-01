import { NextRequest, NextResponse } from "next/server";
import Admin from "../../../../../../model/Admin";
import { connectDB } from "../../../../../../db";
import Category from "../../../../../../model/Category";
import { uploadFile } from "../../../../../../helper/uploadFile";

connectDB();

export const PATCH = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;
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
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const categories = JSON.parse(
      (formData.get("categories") as string) || "[]"
    ) as string[];

    const newCategory: any = {};
    if (name) newCategory.name = name;
    if (description) newCategory.description = description;
    if (file) {
      const imgUrl = await uploadFile("server/category", file);
      if (imgUrl === null) {
        return NextResponse.json(
          { success: false, msg: "Internal Server Error" },
          { status: 500 }
        );
      }
      newCategory.img = imgUrl;
    }

    // Update parent and child categories
    // if (categories.length > 0) {
      // Remove this category from current parent categories' childCategory
      const currentCategory = await Category.findById(id);
      const currentParentCategories = currentCategory.parentCategory;
      await Category.updateMany(
        { _id: { $in: currentParentCategories } },
        { $pull: { childCategory: id } }
      );

      // Set new parent categories
      newCategory.parentCategory = categories;

      for (const categoryId of categories) {
        const parentCategory = await Category.findById(categoryId);
        if (!parentCategory.childCategory.includes(id)) {
          await Category.findByIdAndUpdate(categoryId, {
            $push: { childCategory: id },
          });
        }
      }
    // }

    const category = await Category.findByIdAndUpdate(id, newCategory, {
      new: true,
    });

    return NextResponse.json(
      { success: true, msg: "Category updated successfully", category },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const DELETE = async (
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

    const id = params.id;
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return NextResponse.json(
        { success: false, msg: "Category not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: true, msg: "Success", category },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error to delete category", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic"