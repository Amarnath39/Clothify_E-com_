import { NextRequest, NextResponse } from "next/server";
import Admin from "../../../../../model/Admin";
import { connectDB } from "../../../../../../db";
import Product from "../../../../../model/Product";

export const dynamic = "force-dynamic";
export const GET = async (req: NextRequest) => {
  try {
    await connectDB();
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

    // Find the top 3 most-selling products using the sellCount field
    const topProducts = await Product.find()
      .sort({ sellCount: -1 }) // Sort by sellCount in descending order
      .limit(3) // Limit to the top 3 products
      .select("name sellCount offerPrice") // Select relevant fields
      .lean();

    // Calculate revenue for each product
    const result = topProducts.map((product) => ({
      _id: product._id,
      name: product.name,
      totalUnitsSold: product.sellCount,
      revenue: product.sellCount * product.offerPrice,
    }));

    return NextResponse.json(
      { success: true, msg: "Success", topProducts: result },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error to get sales overview", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};
