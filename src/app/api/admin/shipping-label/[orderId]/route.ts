import { NextRequest, NextResponse } from "next/server";
import Order from "@/model/Order";
import Admin from "@/model/Admin";
import { connectDB } from "@/../db";

interface Params {
    params: { orderId: string };
}

export async function GET(req: NextRequest, { params }: Params) {
    try {
        await connectDB();

        // ✅ Authorization check - Admin, SuperAdmin, or Sales person
        const adminId = req.headers.get("x-admin-id");
        if (!adminId) {
            return NextResponse.json(
                { success: false, error: "Please provide Admin Id" },
                { status: 400 }
            );
        }

        const admin = await Admin.findById(adminId);
        if (
            !admin ||
            (admin.role !== "Admin" && admin.role !== "SuperAdmin" && admin.role !== "Sales person")
        ) {
            return NextResponse.json(
                { success: false, error: "Unauthorized - Admin, SuperAdmin, or Sales person access required" },
                { status: 401 }
            );
        }

        const { orderId } = params;

        // ✅ Fetch order and validate
        const order = await Order.findById(orderId);
        if (!order) {
            return NextResponse.json(
                { success: false, error: "Order not found" },
                { status: 404 }
            );
        }

        // ✅ Validate payment status
        if (order.paymentStatus !== "PAYMENT_SUCCESS") {
            return NextResponse.json(
                {
                    success: false,
                    error: "Shipping label can only be generated for confirmed payments",
                    paymentStatus: order.paymentStatus,
                },
                { status: 400 }
            );
        }

        // ✅ Validate AWB exists
        if (!order.dtdc?.referenceNumber) {
            return NextResponse.json(
                {
                    success: false,
                    error: "AWB reference number not generated yet. Please ensure order has been processed.",
                },
                { status: 400 }
            );
        }

        const referenceNumber = order.dtdc.referenceNumber;

        // ✅ Call DTDC Shipping Label API
        console.log(
            `📄 Fetching shipping label for order ${orderId}, AWB: ${referenceNumber}`
        );

        const dtdcApiUrl = new URL(
            "/api/customer/integration/consignment/shippinglabel/stream",
            "https://dtdcapi.shipsy.io"
        );
        dtdcApiUrl.searchParams.set("reference_number", referenceNumber);
        dtdcApiUrl.searchParams.set("label_code", "SHIP_LABEL_4X6");
        dtdcApiUrl.searchParams.set("label_format", "pdf");

        const dtdcResponse = await fetch(dtdcApiUrl.toString(), {
            method: "GET",
            headers: {
                accept: "application/pdf",
                "api-key": process.env.DTDC_API_KEY || "",
            },
        });

        if (!dtdcResponse.ok) {
            const errorText = await dtdcResponse.text();
            console.error(
                `❌ DTDC API error for order ${orderId}:`,
                dtdcResponse.status,
                errorText
            );

            return NextResponse.json(
                {
                    success: false,
                    error: "Failed to fetch shipping label from DTDC",
                    details: errorText,
                    dtdcStatus: dtdcResponse.status,
                },
                { status: 500 }
            );
        }

        // ✅ Stream PDF response to client
        const pdfBlob = await dtdcResponse.blob();

        console.log(
            `✅ Shipping label fetched successfully for order ${orderId}`
        );

        return new NextResponse(pdfBlob, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="shipping-label-${orderId}.pdf"`,
            },
        });
    } catch (error: any) {
        console.error("Shipping label error:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Internal server error while fetching shipping label",
                details: error.message,
            },
            { status: 500 }
        );
    }
}
