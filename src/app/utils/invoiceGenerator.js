import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import fs from "fs";
import path from "path";

export const generateInvoicePDF = async (order, companyDetails) => {
  // Create a new PDF document
  const doc = new jsPDF();

  // Set font
  doc.setFont("helvetica");

  // Get the logo
  try {
    // Read the logo from the public directory
    const logoPath = path.join(process.cwd(), "public", "image", "logo.png");

    // Check if file exists
    if (fs.existsSync(logoPath)) {
      // Convert image to base64
      const logoData = fs.readFileSync(logoPath);
      const logoBase64 = Buffer.from(logoData).toString("base64");

      // Add logo to the PDF
      doc.addImage(
        `data:image/png;base64,${logoBase64}`,
        "PNG",
        10, // x position
        15, // y position
        75, // width
        30, // height
        undefined,
        "FAST" // compression option
      );
    }
  } catch (error) {
    console.error("Error loading logo:", error);
    // Continue without logo if there's an error
  }

  // Add invoice header (moved down to account for logo)
  doc.setFontSize(24);
  doc.setTextColor(44, 62, 80); // #2c3e50
  doc.text("Invoice", doc.internal.pageSize.width / 2, 20, {
    align: "center",
  });

  // Add invoice details and company info
  doc.setFontSize(10);
  doc.setTextColor(51, 51, 51); // #333333

  doc.text(`Invoice Number: ${order.invoiceId || "N/A"}`, 15, 55);
  doc.text(`Order Number: ${order.orderId || "N/A"}`, 15, 60);
  doc.text(
    `Date: ${
      order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"
    }`,
    15,
    65
  );

  doc.text(
    `Payment Method: ${order.paymentMethod || "Not specified"}`,
    doc.internal.pageSize.width - 15,
    55,
    { align: "right" }
  );

  // From (Company details)
  doc.setFontSize(11);
  doc.text("From:", 15, 75);
  doc.setFontSize(10);
  doc.text(companyDetails.name, 15, 82);
  doc.text(companyDetails.address, 15, 89);

  // To (Customer details)
  doc.setFontSize(11);
  doc.text("To:", doc.internal.pageSize.width - 15, 75, { align: "right" });
  doc.setFontSize(10);
  doc.text(
    order.user?.name || "Customer Name",
    doc.internal.pageSize.width - 15,
    82,
    { align: "right" }
  );
  doc.text(
    order.user?.email || "Customer Email",
    doc.internal.pageSize.width - 15,
    89,
    { align: "right" }
  );
  doc.text(
    order.shippingAddress?.address || "Address not available",
    doc.internal.pageSize.width - 15,
    96,
    { align: "right" }
  );

  // Add order items table
  const tableData = order.productDetails.map((item) => [
    item.product?.name || "Product Name",
    item.count || 0,
    `${(item.product?.offerPrice || 0).toFixed(2)}`,
    `${((item.count || 0) * (item.product?.offerPrice || 0)).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: 105, // Moved down to account for logo and adjusted spacing
    head: [["Item", "Quantity", "Price (Rs.)", "Total (Rs.)"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [242, 242, 242],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    foot: [
      [
        "",
        "",
        "Shipping Cost:",
        `Rs. ${(order?.shippingAddress?.state === "Kerala" ? 0 : 200).toFixed(
          2
        )}`,
      ],
      ["", "", "Total:", `Rs. ${(order.payablePrice || 0).toFixed(2)}`],
    ],
    footStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
  });

  // Add footer
  const finalY = doc.lastAutoTable.finalY || 235;
  doc.setFontSize(9);
  doc.setTextColor(119, 119, 119); // #777777
  doc.text(
    "Thank you for your business!",
    doc.internal.pageSize.width / 2,
    finalY + 20,
    { align: "center" }
  );

  // Return the PDF buffer
  return doc.output("arraybuffer");
};