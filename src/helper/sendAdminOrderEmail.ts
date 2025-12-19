import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';


export interface OrderDetails {
  orderId: string;
  customerName: string;
  totalAmount: string;
  orderDate: string;
  customerEmail: string;
}

// Function to send email to admin when an order is placed
export const sendAdminOrderEmail = async (orderDetails: OrderDetails): Promise<void> => {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.zeptomail.in", // Or smtpout.secureserver.net if GoDaddy
      port: 587,
      secure: false,
      auth: {
        user: "emailapikey",
        pass: "PHtE6r0OFO/qiGEq9kIA7ffpFsSmZN9/+79iJVFP44dAXPYAS01VrNEoxjfjqE0vXaZDEKWdnYtusOnNte6BJGy7NzkZW2qyqK3sx/VYSPOZsbq6x00YtF0fd0XaV4Hmdt5s1SfQv9jcNA==",
      }
    });

    // Load and process email template
    const templatePath = path.join(process.cwd(), 'emailTemplate', 'order-template.html');
    const template = fs.readFileSync(templatePath, 'utf-8');
    const emailContent = template
      .replace('{{orderId}}', orderDetails.orderId)
      .replace('{{customerName}}', orderDetails.customerName)
      .replace('{{totalAmount}}', orderDetails.totalAmount)
      .replace('{{orderDate}}', orderDetails.orderDate);

    // Prepare mail options
    const mailOptions = {
      from: '"siskerala" <orders@siskerala.com>',
      to: process.env.REC_EMAIL || 'sisbymridhulaparvathy@gmail.com',
      subject: '🛒 New Order Received',
      html: emailContent,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log(`✅ Order email sent to admin`);
  } catch (error) {
    console.error(`❌ Error sending order email:`, error);
  }
};
