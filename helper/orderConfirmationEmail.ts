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
        pass: "PHtE6r1ZF+3pjGd8p0IBtvfrE8amZI54rO5vKwREsYsRXqMGTE1cqI8rlWOyrxwjUPdGRv+Syohv5e6a4rjRJD7vPWZLW2qyqK3sx/VYSPOZsbq6x00Zs1kZdkPUXYLtc9Jt0iHfud/aNA==",
      },
    });

    const mailOptions = {
      from: '"Udayaada" <orders@udayaada.in>',
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