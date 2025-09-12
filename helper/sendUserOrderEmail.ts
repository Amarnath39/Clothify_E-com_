import nodemailer from "nodemailer";
import { orderShippedTemplate } from "../emailTemplate/order-shipped";
import { getOrderInvoicePDF } from "../src/app/utils/getOrderInvoice";

export interface OrderDetails {
  orderId: string;
  customerName: string;
  totalAmount: string;
  orderDate: string;
  customerEmail: string;
  user?: any;
}

export const sendOrderShippedEmail = async (orderDetails: OrderDetails): Promise<void> => {
  try {
    // Create transporter using ZeptoMail
    const transporter = nodemailer.createTransport({
      host: "smtp.zeptomail.in",
      port: 587,
      secure: false, // false for port 587
      auth: {
        user: "emailapikey", // ZeptoMail username (literal)
        pass: "PHtE6r1ZF+3pjGd8p0IBtvfrE8amZI54rO5vKwREsYsRXqMGTE1cqI8rlWOyrxwjUPdGRv+Syohv5e6a4rjRJD7vPWZLW2qyqK3sx/VYSPOZsbq6x00Zs1kZdkPUXYLtc9Jt0iHfud/aNA==", // Your actual API key
      },
    });

    // Get HTML content from template
    const emailContent = orderShippedTemplate(orderDetails);

    // Define mail options
    const mailOptions = {
      from: '"Udayaada" <orders@udayaada.in>', // Verified sender from ZeptoMail
      to: orderDetails.customerEmail,
      subject: "📦 Your Order Has Been Shipped!",
      html: emailContent,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log("✅ Order shipped email sent to:", orderDetails.customerEmail);
  } catch (error) {
    console.error("❌ Error sending order shipped email:", error);
  }
};
