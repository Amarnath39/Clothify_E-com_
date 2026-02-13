import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../../../../db";
import { exportOrdersToExcel } from "@/app/services/orderExportservice";
import Admin from "@/model/Admin";

export async function POST(req: NextRequest) {
    await connectDB();
    try{
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

    const body = await req.json();
    const { filters, fields } = body;

    // DEFAULT FIELDS IF NONE SENT
    const defaultFields = [
        "orderId",
        "totalPrice",
        "payablePrice",
        "paymentStatus",
        "paymentMethod",
        "payerEmail",
        "orderType",
        "productCount",
        "createdAt",
    ];

    const selectedFields = fields?.length ? fields : defaultFields;

    const buffer = await exportOrdersToExcel(filters || {}, selectedFields);

    return new Response(buffer, {
        headers: {
            "Content-Type":
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": 'attachment; filename="orders.xlsx"',
        },
    });
    }catch(error){
        console.log(error);
        return NextResponse.json(
            { success: false, msg: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export const runtime = "nodejs";