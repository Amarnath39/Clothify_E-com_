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
      name: "Udayaada",
      address:
        "Poyil House,Punnol,Temple Gate,Thalassery,Kannur,Kerala Pin:670102",
    };

    // Create a new PDF document
    const doc = new jsPDF();

    // Set font
    doc.setFont("helvetica");

    // Add company logo (try to add logo, if not available use text)
    try {
      const logoBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAABkCAYAAACoy2Z3AAAACXBIWXMAAA7EAAAOxAGVKw4bAAAE2mlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSfvu78nIGlkPSdXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQnPz4KPHg6eG1wbWV0YSB4bWxuczp4PSdhZG9iZTpuczptZXRhLyc+CjxyZGY6UkRGIHhtbG5zOnJkZj0naHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyc+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpBdHRyaWI9J2h0dHA6Ly9ucy5hdHRyaWJ1dGlvbi5jb20vYWRzLzEuMC8nPgogIDxBdHRyaWI6QWRzPgogICA8cmRmOlNlcT4KICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0nUmVzb3VyY2UnPgogICAgIDxBdHRyaWI6Q3JlYXRlZD4yMDI1LTA5LTA3PC9BdHRyaWI6Q3JlYXRlZD4KICAgICA8QXR0cmliOkV4dElkPjQ0YmQzYzBkLTJjNTAtNDIzOS04YThkLWNkMDllMmJiZGFhYTwvQXR0cmliOkV4dElkPgogICAgIDxBdHRyaWI6RmJJZD41MjUyNjU5MTQxNzk1ODA8L0F0dHJpYjpGYklkPgogICAgIDxBdHRyaWI6VG91Y2hUeXBlPjI8L0F0dHJpYjpUb3VjaFR5cGU+CiAgICA8L3JkZjpsaT4KICAgPC9yZGY6U2VxPgogIDwvQXR0cmliOkFkcz4KIDwvcmRmOkRlc2NyaXB0aW9uPgoKIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PScnCiAgeG1sbnM6ZGM9J2h0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvJz4KICA8ZGM6dGl0bGU+CiAgIDxyZGY6QWx0PgogICAgPHJkZjpsaSB4bWw6bGFuZz0neC1kZWZhdWx0Jz5BZGQgYSBoZWFkaW5nICgxMDAgeCA0MDAgcHgpIC0gVWRheWFhZGEgRmluYWw8L3JkZjpsaT4KICAgPC9yZGY6QWx0PgogIDwvZGM6dGl0bGU+CiA8L3JkZjpEZXNj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"; // Add your base64 logo string here
      
      doc.addImage(logoBase64, "PNG", 10, 10, 70, 25);
    } catch (error) {
      console.error("Error adding logo:", error);
      // If logo fails, add text instead
      doc.setFontSize(18);
      doc.setTextColor(44, 62, 80);
      doc.text("Udayaada", 15, 25);
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
      "Thank you for shopping with Udayaada!",
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
