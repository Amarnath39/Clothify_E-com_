export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import Admin from "../../../../../model/Admin";
import Order from "../../../../../model/Order";
import { connectDB } from "../../../../../../db";

export const GET = async (req: NextRequest) => {
    try {
        await connectDB();
        const adminId = req.headers.get('x-admin-id');
        if (!adminId) {
            return NextResponse.json({ success: false, msg: "Please provide Admin Id" }, { status: 400 });
        }

        const admin = await Admin.findById(adminId);
        if (!admin || (admin.role !== "Admin" && admin.role !== "SuperAdmin")) {
            return NextResponse.json({ success: false, msg: "Unauthorized" }, { status: 401 });
        }

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

         // Get the sales data aggregated by month
         const salesData = await Order.aggregate([
            {
                $match: { paymentStatus: "PAYMENT_SUCCESS" }
            },
            {
                $group: {
                    _id: { $month: "$createdAt" }, // Group by month
                    totalSales: { $sum: "$payablePrice" }, // Sum up the payablePrice for each month
                }
            },
            {
                $sort: { _id: 1 } // Sort by month (1 for ascending order)
            },
            {
                $project: {
                    _id: 0,
                    month: { $arrayElemAt: [monthNames, { $subtract: ["$_id", 1] }] },
                    totalSales: 1
                }
            }
        ]);

        return NextResponse.json({ success: true, msg: "Success", salesData }, { status: 200 });

    } catch (error) {
        console.error("Error to get sales overview", error);
        return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
    }
}