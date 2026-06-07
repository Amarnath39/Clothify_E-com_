import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Admin from "../../../../../model/Admin"; // Adjust path if needed
import { connectDB } from "../../../../../../db"; // Adjust path if needed
import Order from "../../../../../model/Order"; // Adjust path if needed
import "../../../../../model/Product"; // Adjust path if needed
import "../../../../../model/User"; // Adjust path if needed
import "../../../../../model/Address"; // Adjust path if needed

// --- Import Node.js modules for file reading ---
import fs from 'fs';
import path from 'path';
// ---

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
      "productDetails.product", // Ensure this path correctly populates product details
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

    // Calculate discount
    const calculatedDiscount =
      order.totalPrice - (order.payablePrice - (order.shippingCost || 0));

    const companyDetails = {
      name: "Clothify",
      address:
        "demo address,123456",
    };

    // Create a new PDF document
    const doc = new jsPDF();

    // Set font
    doc.setFont("helvetica");

    // --- Load logo from file ---
    try {
      // Construct the absolute path to the logo file
      const logoPath = path.join(process.cwd(), 'public', 'static', 'logo', 'SIS-LOGO.png');

      // Read the image file into a buffer
      const logoBuffer = fs.readFileSync(logoPath);

      // Convert buffer to Base64 string
      const logoBase64 = logoBuffer.toString('base64');

      // Add the image (provide format explicitly)
      doc.addImage(logoBase64, "PNG", 10, 10, 70, 25); // Adjust width/height as needed

    } catch (error) {
      console.error("Error adding logo from file:", error);
      // Fallback to text if logo loading fails
      doc.setFontSize(18);
      doc.setTextColor(44, 62, 80);
      doc.text("SIS", 15, 25);
    }
    // --- End Logo Loading ---

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
      `Date: ${order.createdAt
        ? new Date(order.createdAt).toLocaleDateString("en-IN")
        : "N/A"
      }`,
      doc.internal.pageSize.width - 15,
      58,
      { align: "right" }
    );
    doc.text(
      `Payment Method: ${order.paymentStatus === "NOT_INITIATED"
        ? "Pending"
        : order.paymentMethod || "Online Payment" // Default to "Online Payment"
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
    let startTableY = 91; // Default start Y for table if no address
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
          `${shippingAddress.city}${shippingAddress.zipCode ? ` - ${shippingAddress.zipCode}` : ""
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
        shipYPos += 5;
      }
      startTableY = shipYPos + 10; // Add margin below address
    } else {
      doc.text("Address not available", 15, 91);
      startTableY = 91 + 10;
    }

    // Add order items table
    const tableData = order.productDetails.map((item: any, index: number) => [
      index + 1,
      item.product?.name || "Product Name",
      item.sizeLabel || "Standard", // Use sizeLabel from your schema
      item.count || 0,
      `Rs.${(item.actualPrice || 0).toFixed(2)}`, // Use actualPrice from productDetails
      `Rs.${(item.offerPrice || 0).toFixed(2)}`, // Use offerPrice from productDetails
      `Rs.${((item.count || 0) * (item.offerPrice || 0)).toFixed(2)}`, // Calculate total for the line item
    ]);

    autoTable(doc, {
      startY: startTableY, // Use calculated start Y
      head: [
        [
          "S.No",
          "Item Description",
          "Size",
          "Qty",
          "Actual Price",
          "Discounted Price", // Changed header name
          "Total", // Added Total column header
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
        0: { halign: "center", cellWidth: 12 },
        1: { cellWidth: 55 },
        2: { halign: "center", cellWidth: 18 },
        3: { halign: "center", cellWidth: 12 },
        4: { halign: "right", cellWidth: 28 },
        5: { halign: "right", cellWidth: 30 },
        6: { halign: "right", cellWidth: 25 }, // Style for the new Total column
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
    const finalY = (doc as any).lastAutoTable.finalY || startTableY + 40; // Estimate if table fails

    // Add summary table (right side)
    autoTable(doc, {
      startY: finalY + 5,
      body: [
        ["Sub Total:", `Rs.${(order.totalPrice || 0).toFixed(2)}`],
        ["Discount:", `Rs.${(calculatedDiscount > 0 ? calculatedDiscount : order.off || 0).toFixed(2)}`],
        ["Shipping:", `Rs.${(order.shippingCost || 0).toFixed(2)}`],
        ["Total Amount:", `Rs.${(order.payablePrice || 0).toFixed(2)}`],
      ],
      theme: "plain",
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 40, halign: "right" }, // Adjusted width
        1: { cellWidth: 30, halign: "right" },
      },
      margin: { left: doc.internal.pageSize.width - 85 }, // Adjusted margin
    });

    // Footer with thank you note
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(44, 62, 80);
    doc.text(
      "Thank you for shopping with SIS!",
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