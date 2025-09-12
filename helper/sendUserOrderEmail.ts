import nodemailer from "nodemailer";
import { orderUserTemplate } from "../emailTemplate/order-template-user";

export interface OrderDetails {
  orderId: string;
  customerName: string;
  totalAmount: string;
  orderDate: string;
  customerEmail: string;
  user?: {
    email: string;
    name?: string;
  };
}

// Function to send order confirmation email to the user
export const sendUserOrderEmail = async (orderDetails: OrderDetails): Promise<void> => {
  try {
    // Create transporter using ZeptoMail
    const transporter = nodemailer.createTransport({
      host: "smtp.zeptomail.in",
      port: 587,
      secure: false, // For port 587
      auth: {
        user: "emailapikey", // ZeptoMail user (literal)
        pass: "PHtE6r1ZF+3pjGd8p0IBtvfrE8amZI54rO5vKwREsYsRXqMGTE1cqI8rlWOyrxwjUPdGRv+Syohv5e6a4rjRJD7vPWZLW2qyqK3sx/VYSPOZsbq6x00Zs1kZdkPUXYLtc9Jt0iHfud/aNA==", // Your actual API key
      },
    });

    // Generate email HTML content
    const emailContent = orderUserTemplate(orderDetails);

    // Define mail options
    const mailOptions = {
      from: '"Udayaada" <orders@udayaada.in>', // Verified sender in ZeptoMail
      to: orderDetails?.user?.email || orderDetails.customerEmail,
      subject: "🧾 Order Confirmation - Udayaada",
      html: emailContent,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log("✅ Order confirmation email sent to user:", mailOptions.to);
  } catch (error) {
    console.error("❌ Error sending order confirmation email:", error);
  }
};
