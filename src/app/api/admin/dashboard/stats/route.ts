import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../../db";
import Admin from "../../../../../model/Admin";
import User from "../../../../../model/User";
import Order from "../../../../../model/Order";

connectDB();

export const GET = async (req: NextRequest) => {
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

    // Use Regex for case-insensitive matching and to include potential variations
    const STATUS = /^(PAYMENT_SUCCESS|succeeded|COMPLETED)$/i;

    // ✅ Total Sales
    const totalSales = await Order.countDocuments({ paymentStatus: STATUS });

    // ✅ Total Revenue (Overall)
    const totalRevenueResult = await Order.aggregate([
      { $match: { paymentStatus: STATUS } },
      { $group: { _id: null, totalRevenue: { $sum: "$payablePrice" } } },
    ]);
    const overallRevenue = totalRevenueResult[0]?.totalRevenue || 0;

    // ✅ UAE Revenue (all non-India orders)
    const uaeRevenueResult = await Order.aggregate([
      {
        $match: {
          paymentStatus: STATUS,
          $or: [
            { "shippingAddress.country": { $ne: "India" } },
            { "shippingAddress.country": { $exists: false } }, // include if country not set
          ],
        },
      },
      { $group: { _id: null, uaeRevenue: { $sum: "$payablePrice" } } },
    ]);
    const uaeRevenue = uaeRevenueResult[0]?.uaeRevenue || 0;

    // ✅ India Revenue
    const indRevenueResult = await Order.aggregate([
      { $match: { paymentStatus: STATUS, "shippingAddress.country": "India" } },
      { $group: { _id: null, indRevenue: { $sum: "$payablePrice" } } },
    ]);
    const indRevenue = indRevenueResult[0]?.indRevenue || 0;

    // ✅ Total User
    const totalUsers = await User.countDocuments();

    // ✅ Repeat Orders
    const repeatOrdersResult = await Order.aggregate([
      { $match: { paymentStatus: STATUS } },
      { $group: { _id: "$user", orderCount: { $sum: 1 } } },
      { $match: { orderCount: { $gt: 1 } } },
      { $count: "repeatOrders" },
    ]);
    const repeatOrders = repeatOrdersResult[0]?.repeatOrders || 0;

    return NextResponse.json(
      {
        success: true,
        msg: "Success",
        data: {
          totalSales,
          totalRevenue: {
            overall: overallRevenue,
            uae: uaeRevenue,
            ind: indRevenue,
          },
          totalUsers,
          repeatOrders,
        },
      },
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