import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../db"; // Adjusted relative path
import Product from "@/model/Product";
import StockHistory from "@/model/StockHistory";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const type = searchParams.get("type"); // 'products' or 'history'
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";

        if (type === "history") {
            const query: any = {};
            const history = await StockHistory.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate("productId", "name sku img")
                .populate("orderId", "orderId");

            const total = await StockHistory.countDocuments(query);

            return NextResponse.json({
                success: true,
                history,
                totalPages: Math.ceil(total / limit),
                currentPage: page
            });
        }

        // Default: Fetch Products with Stock Status
        const query: any = {};
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        const products = await Product.find(query)
            .select("name sku img totalStock availableStock sellCount lowStockThreshold sizes")
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Product.countDocuments(query);

        // Calculate status for each product
        // Calculate status for each product
        const inventoryData = products.map((p: any) => {
            let total = Number(p.totalStock) || 0;

            // Fallback: If dynamic/calculated total is 0 but product has sizes, calculate from sizes
            if (total === 0 && p.sizes && p.sizes.length > 0) {
                total = p.sizes.reduce((acc: number, curr: any) => acc + (Number(curr.stock) || 0), 0);
            }

            // Available Stock Logic
            let available = Number(p.availableStock);
            // If available is failing (NaN or 0 while total is positive), default to total
            if (isNaN(available) || (total > 0 && available <= 0)) {
                available = total;
            }

            let status = "In Stock";
            if (available <= 0) status = "Out of Stock";
            else if (available <= (p.lowStockThreshold || 5)) status = "Low Stock";

            return {
                _id: p._id,
                name: p.name,
                sku: p.sku,
                img: p.img?.[0],
                totalStock: total,
                availableStock: available,
                soldStock: Math.max(0, total - available), // ✅ CALCULATED: Always accurate
                lowStockThreshold: p.lowStockThreshold,
                status,
                sizes: p.sizes
            };
        });

        return NextResponse.json({
            success: true,
            inventory: inventoryData,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });

    } catch (error: any) {
        console.error("Inventory API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { productId, variantId, newStock, reason, adminId } = body;

        if (!productId || newStock === undefined) {
            return NextResponse.json({ success: false, msg: "Missing required fields" }, { status: 400 });
        }

        // Fetch product
        const product = await Product.findById(productId);
        if (!product) {
            return NextResponse.json({ success: false, msg: "Product not found" }, { status: 404 });
        }

        let oldStock = 0;
        let finalStock = parseInt(newStock);
        let updated = false;

        // If variantId is provided, update specific size
        if (variantId && product.sizes) {
            const sizeIndex = product.sizes.findIndex((s: any) => s._id.toString() === variantId);
            if (sizeIndex > -1) {
                oldStock = product.sizes[sizeIndex].stock;
                product.sizes[sizeIndex].stock = finalStock;
                updated = true;

                // Recalculate total stock
                const total = product.sizes.reduce((acc: number, curr: any) => acc + (parseInt(curr.stock) || 0), 0);
                product.totalStock = total;
                product.availableStock = total - (product.reservedStock || 0);
            }
        }
        // If no variantId, update totalStock directly (for non-sized products)
        else {
            oldStock = product.totalStock;
            product.totalStock = finalStock;
            product.availableStock = finalStock - (product.reservedStock || 0);
            updated = true;
        }

        if (updated) {
            await product.save();

            // Log history
            await StockHistory.create({
                productId: product._id,
                action: "MANUAL_UPDATE",
                changeAmount: finalStock - oldStock,
                oldStock: oldStock,
                newStock: finalStock,
                reason: reason || "Manual Admin Update",
                adminId: adminId // Optional, if we track who did it
            });

            return NextResponse.json({ success: true, product });
        } else {
            return NextResponse.json({ success: false, msg: "Failed to update stock" }, { status: 400 });
        }

    } catch (error: any) {
        console.error("Inventory Update Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
