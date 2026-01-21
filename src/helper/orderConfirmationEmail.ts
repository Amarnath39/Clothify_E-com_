import nodemailer from "nodemailer";

const orderConfirmationEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
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
      from: '"Siskerala" <orders@siskerala.com>',
      to,
      subject,
      html,
    };

    await transport.sendMail(mailOptions);
    console.log("Email sent to:", to);
  } catch (error) {
    console.error("Email send error:", error);
  }
};

export default orderConfirmationEmail;