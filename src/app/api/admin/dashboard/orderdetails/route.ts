import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../../db";
import Admin from "../../../../../../model/Admin";
import Order from "../../../../../../model/Order";
import "../../../../../../model/Product";

// Ensure database connection is established
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
        const periodDays = Number(url.searchParams.get("period") as string);

        if (isNaN(periodDays) || periodDays <= 0) {
            return NextResponse.json({ success: false, msg: 'Invalid period' }, { status: 400 });
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - periodDays);

        if (!startDate || startDate>new Date()) {
            return NextResponse.json({ success: false, msg: 'Invalid period' }, { status: 400 });
        }

        const salesData = await Order.aggregate([
            { $match: { createdAt: { $gte: startDate } } },
            { $unwind: '$productDetails' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'productDetails.product',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            { $unwind: '$productInfo' },
            {
                $group: {
                    _id: '$productDetails.product',
                    totalSalesAmount: { $sum: { $multiply: ['$productDetails.count', '$productInfo.offerPrice'] } },
                    totalCount: { $sum: '$productDetails.count' },
                    productInfo: { $first: '$productInfo' }
                }
            },
            {
                $project: {
                    _id: 0,
                    productId: '$_id',
                    productName: '$productInfo.name',
                    productImage: '$productInfo.img',
                    productDescription: '$productInfo.description',
                    totalSalesAmount: 1,
                    totalCount: 1
                }
            }
        ]);

        const totalAmount = salesData.reduce((acc, item) => acc + item.totalSalesAmount, 0);
        const totalOrderCount = await Order.countDocuments({ createdAt: { $gte: startDate }, paymentStatus: "succeeded" });

        return NextResponse.json({ success: true, msg: "Success", totalAmount, salesData, totalOrderCount }, { status: 200 });

    } catch (error) {
        console.error("Error to get admin order details", error);
        return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
    }
};
