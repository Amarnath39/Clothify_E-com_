import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Admin from "../../../../../../model/Admin";
import { connectDB } from "../../../../../../db";
import Order from "../../../../../../model/Order";
import "../../../../../../model/Product";
import "../../../../../../model/User";
import "../../../../../../model/Address";

connectDB();

const generateInvoiceId = () => {
  return "INV-" + Math.random().toString(36).substring(2, 9).toUpperCase();
};

export const GET = async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    const { id } = params;
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
    const order = await Order.findById(id).populate([
      "productDetails.product",
      "user",
      "shippingAddress",
      "exchangeReason",
    ]);
    if (!order) {
      return NextResponse.json(
        { success: false, msg: "Order not found" },
        { status: 404 }
      );
    }
    if (!order.invoiceId) {
      order.invoiceId = generateInvoiceId();
      await order.save();
    }

    // Calculate discount (similar to Elegant Threads implementation)
    const calculatedDiscount =
      order.totalPrice - (order.payablePrice - (order.shippingCost || 0));

    const companyDetails = {
      name: "Fancyvastra",
      address:
        "Naseem and Sons silk Creations J-11/75, BUNKAR COLONY, NATI INLI, Varanasi, Uttar Pradesh, India - 221001",
    };

    // Create a new PDF document
    const doc = new jsPDF();

    // Set font
    doc.setFont("helvetica");

    // Add company logo (try to add logo, if not available use text)
    try {
      const logoPath = "/assets/static/logo/logo.png";
      doc.addImage(logoPath, "PNG", 15, 15, 40, 15);
    } catch (error) {
      console.error("Error adding logo:", error);
      // If logo fails, add text instead
      doc.setFontSize(18);
      doc.setTextColor(44, 62, 80);
      doc.text("FANCYVASTRA", 15, 25);
    }

    // Add invoice header
    doc.setFontSize(20);
    doc.setTextColor(44, 62, 80); // #2c3e50
    doc.text("INVOICE", doc.internal.pageSize.width - 15, 25, {
      align: "right",
    });

    // Add a horizontal line under the header
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(15, 32, doc.internal.pageSize.width - 15, 32);

    // Add invoice details and company info
    doc.setFontSize(10);
    doc.setTextColor(51, 51, 51); // #333333

    // Company details (left column)
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("FROM:", 15, 40);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(companyDetails.name, 15, 46);

    // Split address into multiple lines for better readability
    const addressLines = doc.splitTextToSize(companyDetails.address, 90);
    let yPos = 52;
    addressLines.forEach((line) => {
      doc.text(line, 15, yPos);
      yPos += 5;
    });

    // Invoice details (right column)
    doc.setFont("helvetica", "bold");
    doc.text("INVOICE DETAILS:", doc.internal.pageSize.width - 15, 40, {
      align: "right",
    });
    doc.setFont("helvetica", "normal");
    doc.text(
      `Invoice No: ${order.invoiceId || "N/A"}`,
      doc.internal.pageSize.width - 15,
      46,
      { align: "right" }
    );
    doc.text(
      `Order No: ${order.orderId || "N/A"}`,
      doc.internal.pageSize.width - 15,
      52,
      { align: "right" }
    );
    doc.text(
      `Date: ${
        order.createdAt
          ? new Date(order.createdAt).toLocaleDateString("en-IN")
          : "N/A"
      }`,
      doc.internal.pageSize.width - 15,
      58,
      { align: "right" }
    );
    doc.text(
      `Payment Method: ${
        order.paymentStatus === "NOT_INITIATED"
          ? "Pending"
          : order.paymentMethod || "Not specified"
      }`,
      doc.internal.pageSize.width - 15,
      64,
      { align: "right" }
    );
    doc.text(
      `Order Status: ${order.currentStatus || "N/A"}`,
      doc.internal.pageSize.width - 15,
      70,
      { align: "right" }
    );
    doc.text(
      `Payment Status: ${order.paymentStatus || "N/A"}`,
      doc.internal.pageSize.width - 15,
      76,
      { align: "right" }
    );

    // Shipping details
    doc.setFont("helvetica", "bold");
    doc.text("SHIP TO:", 15, 85);
    doc.setFont("helvetica", "normal");

    const shippingAddress = order.shippingAddress;
    if (shippingAddress) {
      doc.text(shippingAddress.name || order.user?.name || "Customer", 15, 91);
      let shipYPos = 97;

      if (shippingAddress.address) {
        const shipAddressLines = doc.splitTextToSize(
          shippingAddress.address,
          90
        );
        shipAddressLines.forEach((line) => {
          doc.text(line, 15, shipYPos);
          shipYPos += 5;
        });
      }

      if (shippingAddress.city) {
        doc.text(
          `${shippingAddress.city}${
            shippingAddress.zipCode ? ` - ${shippingAddress.zipCode}` : ""
          }`,
          15,
          shipYPos
        );
        shipYPos += 5;
      }

      if (shippingAddress.state) {
        doc.text(
          `${shippingAddress.state}, ${shippingAddress.country || "India"}`,
          15,
          shipYPos
        );
        shipYPos += 5;
      }

      if (shippingAddress.mobile) {
        doc.text(`Phone: ${shippingAddress.mobile}`, 15, shipYPos);
        shipYPos += 5;
      }

      if (order.user?.email) {
        doc.text(`Email: ${order.user.email}`, 15, shipYPos);
      }
    } else {
      doc.text("Address not available", 15, 91);
    }

    // Add order items table
    const tableData = order.productDetails.map((item: any, index: number) => [
      index + 1,
      item.product?.name || "Product Name",
      item.size?.size || "Standard",
      item.count || 0,
      `Rs.${(item.product?.actualPrice || 0).toFixed(2)}`,
      `Rs.${(
        (item.count || 0) *
        (item.size?.offerPrice || item.product?.offerPrice || 0)
      ).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 125,
      head: [
        [
          "S.No",
          "Item Description",
          "Size",
          "Qty",
          "Actual Price",
          "Discounted Amount",
        ],
      ],
      body: tableData,
      theme: "striped",
      headStyles: {
        fillColor: [230, 230, 230],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { halign: "center", cellWidth: 15 },
        1: { cellWidth: 60 },
        2: { halign: "center", cellWidth: 20 },
        3: { halign: "center", cellWidth: 15 },
        4: { halign: "right", cellWidth: 35 },
        5: { halign: "right", cellWidth: 35 },
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      styles: {
        fontSize: 9,
        lineColor: [220, 220, 220],
        lineWidth: 0.1,
      },
    });

    // Calculate final Y position after the table
    const finalY = (doc as any).lastAutoTable.finalY || 220;

    // Add summary table (right side)
    autoTable(doc, {
      startY: finalY + 5,
      body: [
        ["Sub Total:", `Rs.${(order.totalPrice || 0).toFixed(2)}`],
        ["Discount:", `Rs.${(calculatedDiscount || 0).toFixed(2)}`],
        ["Shipping:", `Rs.${(order.shippingCost || 0).toFixed(2)}`],
        ["Total Amount:", `Rs.${(order.payablePrice || 0).toFixed(2)}`],
      ],
      theme: "plain",
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50, halign: "right" },
        1: { cellWidth: 30, halign: "right" },
      },
      margin: { left: doc.internal.pageSize.width - 100 },
    });

    // Footer with thank you note
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(44, 62, 80);
    doc.text(
      "Thank you for shopping with Fancyvastra!",
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 20,
      { align: "center" }
    );

    // Generate PDF buffer
    const pdfBuffer = doc.output("arraybuffer");

    // Return the PDF buffer as a response
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=invoice-${order.invoiceId}.pdf`,
      },
    });
  } catch (error) {
    console.error("Error generating invoice", error);
    return NextResponse.json(
      { success: false, msg: "Internal Server Error" },
      { status: 500 }
    );
  }
};
