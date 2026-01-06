import { NextRequest, NextResponse } from "next/server";
import Order from "../../../../model/Order";
import "../../../../model/Product";
import "../../../../model/User";
import "../../../../model/Address";
import { connectDB } from "../../../../../db";
import Admin from "../../../../model/Admin";
import "../../../../model/Exchange";
import User from "../../../../model/User";
import Product from "../../../../model/Product";

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
    if (
      !admin ||
      (admin.role !== "Sales person" &&
        admin.role !== "Admin" &&
        admin.role !== "SuperAdmin")
    ) {
      return NextResponse.json(
        { success: false, msg: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const search = url.searchParams.get("search");
    const paymentStatus = url.searchParams.get("paymentStatus");
    const orderStatus = url.searchParams.get("orderStatus");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");

    const searchCriteria: any = {};
    // const searchCriteria: any = { paymentStatus: { $ne: "Checkout" } };

    if (search) {
      const regex = new RegExp(search, "i"); // 'i' for case-insensitive
      searchCriteria.$or = [
        { orderId: regex },
        { transactionId: regex },
        { productDetails: { $in: { "product.name": regex } } }, // Match by product name
        { user: { $in: await User.find({ name: regex }).select("_id") } }, // Match by user name
      ];
    }

    if (paymentStatus) {
      const regex = new RegExp(paymentStatus, "i");
      searchCriteria.paymentStatus = regex;
    }
    if (orderStatus) {
      const regex = new RegExp(orderStatus, "i");
      searchCriteria.currentStatus = regex;
    }

    // ✅ NEW: Order Source Filter
    const orderSource = url.searchParams.get("orderSource");
    if (orderSource) {
      if (orderSource === "offline") {
        searchCriteria.orderSource = "ADMIN_OFFLINE";
      } else if (orderSource === "online") {
        // Online orders don't have orderSource field set
        searchCriteria.orderSource = { $exists: false };
      }
    }

    // Date filter based on updatedAt
    if (startDate || endDate) {
      searchCriteria.date = {};
      const eDate = new Date(endDate as string);
      eDate.setHours(eDate.getHours() + 24);
      if (startDate) {
        searchCriteria.date.$gte = new Date(startDate); // Greater than or equal to startDate
      }
      if (endDate) {
        searchCriteria.date.$lte = eDate; // Less than or equal to endDate
      }
    }

    const orders = await Order.find(searchCriteria)
      .populate({
        path: "productDetails.product",
        model: "Product",
      })
      .populate({
        path: "user",
        model: "User",
        populate: {
          path: "defaultAddress",
          model: "Address",
        },
      })
      .populate(["user", "exchangeReason"])
      .sort({ createdAt: -1 }).lean();
    return NextResponse.json(
      { success: true, msg: "Success", orders },
      { status: 200 }
    );
  } catch (error) {
    console.log("Error to get order", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};
