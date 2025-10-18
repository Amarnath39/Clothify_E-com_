export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../../db";
import Admin from "../../../../../model/Admin";
import User from "../../../../../model/User";
import Order from "../../../../../model/Order";

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

         // Calculate Total Sales (total number of valid orders with payment status "Success")
         const totalSales = await Order.countDocuments({ paymentStatus: "PAYMENT_SUCCESS" });

         // Calculate Total Revenue (sum of payablePrice of all valid orders with payment status "Success")
         const totalRevenueResult = await Order.aggregate([
             {
                 $match: { paymentStatus: "PAYMENT_SUCCESS" }
             },
             {
                 $group: {
                     _id: null,
                     totalRevenue: { $sum: "$payablePrice" }
                 }
             }
         ]);
         const totalRevenue = totalRevenueResult[0]?.totalRevenue || 0;
 
         // Calculate Total Users (total number of users)
         const totalUsers = await User.countDocuments();
 
         // Calculate Repeat Orders (number of users who have placed more than one valid order with payment status "Success")
         const repeatOrdersResult = await Order.aggregate([
             {
                 $match: { paymentStatus: "PAYMENT_SUCCESS" }
             },
             {
                 $group: {
                     _id: "$user",
                     orderCount: { $sum: 1 }
                 }
             },
             {
                 $match: {
                     orderCount: { $gt: 1 }
                 }
             },
             {
                 $count: "repeatOrders"
             }
         ]);
         const repeatOrders = repeatOrdersResult[0]?.repeatOrders || 0;
 
         return NextResponse.json({
             success: true,
             msg: "Success",
             data: {
                 totalSales,
                 totalRevenue,
                 totalUsers,
                 repeatOrders
             }
         }, { status: 200 });

    } catch (error) {
        console.error("Error to get sales overview", error);
        return NextResponse.json({ success: false, msg: "Internal Server Error" }, { status: 500 });
    }
}