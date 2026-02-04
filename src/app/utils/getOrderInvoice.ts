import Order from "../../model/Order";
import { connectDB } from "../../../db";
import { generateInvoicePDF } from "../utils/invoiceGenerator";

const generateInvoiceId = () => {
  return "INV-" + Math.random().toString(36).substring(2, 9).toUpperCase();
};

export const getOrderInvoicePDF = async (orderId) => {
  try {
    await connectDB();

    const order = await Order.findById(orderId).populate([
      "productDetails.product",
      "user",
      "shippingAddress",
      "exchangeReason",
    ]);

    if (!order) {
      throw new Error("Order not found");
    }

    // Generate invoice ID if not present
    if (!order.invoiceId) {
      order.invoiceId = generateInvoiceId();
      await order.save();
    }

    const companyDetails = {
      name: "Swaarasya",
      address: "BiBi Square, Shop No 2,Chalad, Kannur 670014",
    };

    // Generate PDF buffer
    const pdfBuffer = await generateInvoicePDF(order, companyDetails);

    return {
      buffer: pdfBuffer,
      filename: `invoice-${order.invoiceId}.pdf`,
    };
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    throw error;
  }
};