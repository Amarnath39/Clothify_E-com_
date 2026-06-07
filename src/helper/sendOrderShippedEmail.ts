import nodemailer from "nodemailer";
import { orderShippedTemplate } from "../../emailTemplate/order-shipped";

export interface OrderDetails {
  trackingId: string;
  deliveryPartner: string;
  userName: string;
  userEmail: string;
  companyName: string;
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
        pass: process.env.ZEPTO_API_KEY, // Your actual API key
      },
    });

    // Get HTML content from template
    const emailContent = orderShippedTemplate(orderDetails);

    // Define mail options
    const mailOptions = {
      from: '"Clothify" <noreply@clothify.com>', // Verified sender from ZeptoMail
      to: orderDetails.userEmail,
      subject: "📦 Your Order Has Been Shipped!",
      html: emailContent,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log("✅ Order shipped email sent to:", orderDetails.userEmail);
  } catch (error) {
    console.error("❌ Error sending order shipped email:", error);
  }
};
