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
        pass: "PHtE6r1bEOHqgmV9oxUFtPW4R8atMIsp/+plJFJGsIlDXvVQSU0D/o0vkmCwo0gjA6JCQPWZyt9osezJ4enRJDu7NmlLVWqyqK3sx/VYSPOZsbq6x00esVkfc0LYXYTrcdNq0STfstrbNA==",
      },
    });

    const mailOptions = {
      from: '"Example Team" <orders@udayaada.in>',
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
