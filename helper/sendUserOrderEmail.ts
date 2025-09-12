import nodemailer from "nodemailer";
import { orderUserTemplate } from "../emailTemplate/order-template-user";
import { getOrderInvoicePDF } from "../src/app/utils/getOrderInvoice";

export interface OrderDetails {
  orderId: string;
  customerName: string;
  totalAmount: string;
  orderDate: string;
  customerEmail: string;
  user?: any;
}

export const sendUserOrderEmail = async (orderDetails: any): Promise<void> => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.zeptomail.in",
      port: 587,
      secure: false,
      auth: {
        user: "emailapikey",
        pass: process.env.ZEPTO_API_KEY as string,
      },
    });

    const emailContent = orderUserTemplate(orderDetails);
    const invoice = await getOrderInvoicePDF(orderDetails._id);

    const mailOptions = {
      from: '"Udayaada" <orders@udayaada.in>',
      to: orderDetails?.user?.email || orderDetails.customerEmail,
      subject: "🧾 Order Confirmation",
      html: emailContent,
      attachments: [
        {
          filename: invoice.filename,
          content: Buffer.from(invoice.buffer),
          contentType: "application/pdf",
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Order confirmation email sent to:", orderDetails.customerEmail);
  } catch (error) {
    console.error("❌ Error sending order confirmation email:", error);
    throw error;
  }
};
