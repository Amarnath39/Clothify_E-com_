import nodemailer from "nodemailer";

const orderConfirmationEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<boolean> => {
  try {
    const transport = nodemailer.createTransport({
      host: "smtp.zeptomail.in",
      port: 587,
      auth: {
        user: "emailapikey",
        pass: process.env.ZEPTO_API_KEY,
      },
    });

    const mailOptions = {
      from: '"Swaarasya" <noreply@swaarasya.com>',
      to,
      subject,
      html,
    };

    await transport.sendMail(mailOptions);
    console.log("Email sent successfully to:", to);
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
};

export default orderConfirmationEmail;