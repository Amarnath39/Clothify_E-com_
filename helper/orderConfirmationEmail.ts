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
        pass: "PHtE6r0OFO/qiGEq9kIA7ffpFsSmZN9/+79iJVFP44dAXPYAS01VrNEoxjfjqE0vXaZDEKWdnYtusOnNte6BJGy7NzkZW2qyqK3sx/VYSPOZsbq6x00YtF0fd0XaV4Hmdt5s1SfQv9jcNA==",
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