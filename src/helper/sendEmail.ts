import nodemailer from "nodemailer";

export const sendEmail = async (email: string, otp: number): Promise<void> => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.zeptomail.in",
      port: 587,
      secure: false, // Use false for port 587
      auth: {
        user: "emailapikey", // ZeptoMail user (this is literal, not your email)
        pass: "PHtE6r1ZF+3pjGd8p0IBtvfrE8amZI54rO5vKwREsYsRXqMGTE1cqI8rlWOyrxwjUPdGRv+Syohv5e6a4rjRJD7vPWZLW2qyqK3sx/VYSPOZsbq6x00Zs1kZdkPUXYLtc9Jt0iHfud/aNA==", // your actual ZeptoMail API key
      },
    });

    const mailOptions = {
      from: '"Udayaada" <varnasuba755@gmail.com>', // ZeptoMail-approved sender
      to: email,
      subject: "Your OTP for Udayaada",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 10px;">
          <h2>Your One-Time Password (OTP)</h2>
          <p><strong>${otp}</strong> is your OTP for Udayaada.</p>
          <p>This OTP is valid for the next <strong>10 minutes</strong>.</p>
          <br/>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ OTP Email sent to:", email);
  } catch (error) {
    console.error("❌ Error sending OTP Email:", error);
  }
};
