import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../../../db";
import Product from "../../../../../../../src/model/Product";
import Category from "../../../../../../../src/model/Category"; // Ensure this is registered


// connectDB(); // Moved inside handler

export const dynamic = "force-dynamic";

/**
 * 📍 GET /api/admin/pos/products/search
 * Fast product search for POS (SKU, Barcode, or Name)
 */
export const GET = async (req: NextRequest) => {
    try {
        await connectDB();

        const adminId = req.headers.get("x-admin-id");

        if (!adminId) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q");

        if (!query || query.trim().length === 0) {
            return NextResponse.json(
                { success: false, message: "Search query required" },
                { status: 400 }
            );
        }

        console.log("🔍 POS Product Search Request:", query);

        // ✅ Search by SKU (exact match), barcode, or name (partial match)
        const searchConditions = [
            { sku: { $regex: query, $options: "i" } },
            { name: { $regex: query, $options: "i" } },
        ];

        const products = await Product.find({
            $or: searchConditions,
        })
            .select("_id name sku img actualPrice sizes categories")
            .populate("categories", "name gst")
            .limit(20)
            .lean();

        // ✅ Filter out products with zero stock
        const productsWithStock = products.filter((product: any) => {
            return product.sizes?.some((size: any) => size.stock > 0);
        });

        console.log(
            `✅ Found ${productsWithStock.length} products with stock out of ${products.length} total`
        );

        return NextResponse.json(
            {
                success: true,
                products: productsWithStock,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("❌ POS Product search failed CRITICAL:");
        console.error("Error Message:", error.message);
        console.error("Error Stack:", error.stack);

        return NextResponse.json(
            {
                success: false,
                message: "Search failed",
                error: error.message,
                debug: process.env.NODE_ENV === "development" ? error.stack : undefined
            },
            { status: 500 }
        );
    }
};
