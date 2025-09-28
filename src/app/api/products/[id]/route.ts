import { NextRequest, NextResponse } from "next/server";
import Product from "../../../../../model/Product";
import "../../../../../model/ReturnRules";
import { connectDB } from "../../../../../db";
import "../../../../../model/Category";
import "../../../../../model/ReturnRules";

connectDB();

export const GET = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const id = params.id;
    const product = await Product.findById(id).populate([
      "categories",
      "colors.varientId"
      "returnRules",
    ]);
    if (!product)
      return NextResponse.json(
        { success: false, msg: "Product not found" },
        { status: 404 }
      );
      const sizeOrder = [
        "M",
        "L",
        "XL",
        "XXL",
        "3XL",
        "4XL",
        "5XL",
        "6XL",
        "Others",
        "Freesize",
      ];

      product.sizes.sort((a: any, b: any) => {
        return sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size);
      });
      
    return NextResponse.json(
      { success: true, msg: "Success", product },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error to get product by id", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
};

export const dynamic = "force-dynamic"
