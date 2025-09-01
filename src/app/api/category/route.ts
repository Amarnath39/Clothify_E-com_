import { NextRequest, NextResponse } from "next/server";
import Category from "../../../../model/Category";
import { connectDB } from "../../../../db";

connectDB();

export const GET = async (req: NextRequest) => {
    try {
      const categories = await Category.find().populate(["parentCategory", "childCategory"]);
      return NextResponse.json(
        { success: true, msg: "Success", categories },
        { status: 201 }
      );
    } catch (error) {
      console.log("Error to get categories ", error);
      return NextResponse.json(
        { success: false, msg: "Internal Server Error", error: error.message },
        { status: 500 }
      );
    }
  };

  export const dynamic = "force-dynamic"