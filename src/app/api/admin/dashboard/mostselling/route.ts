import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../../db";
import Product from "../../../../../../model/Product";
import Admin from "../../../../../../model/Admin";

connectDB();

export const GET = async (req: NextRequest) => {
    try {
        const adminId = req.headers.get('x-admin-id');
        if (!adminId) {
            return NextResponse.json({ success: false, msg: "Please provide Admin Id" }, { status: 400 });
        }

        const admin = await Admin.findById(adminId);
        if (!admin || (admin.role !== "Admin" && admin.role !== "SuperAdmin")) {
            return NextResponse.json({ success: false, msg: "Unauthorized" }, { status: 401 });
        }

        const url = new URL(req.url);
        const limit = parseInt(url.searchParams.get("limit") as string) || 10;
        const page = parseInt(url.searchParams.get("page") as string) || 1;
        const search = url.searchParams.get("search") as string;

        // Build the search criteria
        const searchCriteria: any = {};

        if (search) {
            const regex = new RegExp(search, "i"); // 'i' for case-insensitive
            searchCriteria.$or = [{ name: regex }, { description: regex }];
        }

        // Calculate the skip value
        const skip = (page - 1) * limit;
        const mostSellingProducts = await Product.find(searchCriteria)
            .populate("categories")
            .sort({ sellCount: -1 })
            .skip(skip)
            .limit(limit);

        // Get the total count of products matching the search criteria
        const totalProducts = await Product.countDocuments(searchCriteria);

        // Calculate the total number of pages
        const totalPages = Math.ceil(totalProducts / limit);
        return NextResponse.json(
            {
                success: true,
                msg: "Success",
                mostSellingProducts,
                totalPages,
                previousPage: page === 1 ? null : page - 1,
                currentPage: page,
                nextPage: page === totalPages ? null : page + 1,
                totalProducts,
            },
            { status: 200 }
        );
    } catch (error) {
        console.log("Error to get admin most selling product details", error);
        return NextResponse.json(
            { success: false, msg: "Internal Server Error" },
            { status: 500 }
        );
    }
};
