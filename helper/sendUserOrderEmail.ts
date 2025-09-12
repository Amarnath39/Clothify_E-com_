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

// Function to send an email with invoice attachment
export const sendUserOrderEmail = async (orderDetails: any) => {
  try {
    // Create a transporter
    // let transporter = nodemailer.createTransport({
    //   // host: "smtpout.secureserver.net",
    //   // host: "smtpout.secureserver.net",
    //   port: 465,
    //   auth: {
    //     user: process.env.EMAIL_USER,
    //     pass: process.env.EMAIL_PASS,
    //   },
    // });
    var transporter = nodemailer.createTransport({
      host: "smtp.zeptomail.in",
      port: 587,
      auth: {
        user: "emailapikey",
        pass: "PHtE6r1ZF+3pjGd8p0IBtvfrE8amZI54rO5vKwREsYsRXqMGTE1cqI8rlWOyrxwjUPdGRv+Syohv5e6a4rjRJD7vPWZLW2qyqK3sx/VYSPOZsbq6x00Zs1kZdkPUXYLtc9Jt0iHfud/aNA==",
      },
  });

    // Generate the email content from template
    const emailContent = orderUserTemplate(orderDetails);

    // Get invoice PDF for attachment
    const invoice = await getOrderInvoicePDF(orderDetails._id);

    // Define email options with attachment
    const mailOptions = {
      from: '"Udayaada" <orders@udayaada.in>',
      to: orderDetails?.user?.email,
      subject: "Order Confirmation",
      html: emailContent,
      attachments: [
        {
          filename: invoice.filename,
          content: Buffer.from(invoice.buffer),
          contentType: "application/pdf",
        },
      ],
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log("Order email with invoice sent successfully");
  } catch (error) {
    console.error("Error sending order email with invoice", error);
  }
};