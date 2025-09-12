import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Function to send a welcome email
export const sendSubscribeEmail = async (email: string): Promise<void> => {
  try {
    // Create a transporter using ZeptoMail
    const transporter = nodemailer.createTransport({
      host: "smtp.zeptomail.in",
      port: 587,
      secure: false, // Use false for port 587
      auth: {
        user: "emailapikey",
        pass: "PHtE6r1ZF+3pjGd8p0IBtvfrE8amZI54rO5vKwREsYsRXqMGTE1cqI8rlWOyrxwjUPdGRv+Syohv5e6a4rjRJD7vPWZLW2qyqK3sx/VYSPOZsbq6x00Zs1kZdkPUXYLtc9Jt0iHfud/aNA=="
      }
    });

    // Load and prepare HTML email template
    const templatePath = path.join(process.cwd(), 'emailTemplate/subscribe-template.html');
    const template = fs.readFileSync(templatePath, 'utf-8');

    const emailContent = template
      .replaceAll('{{Your Company Name}}', 'Udayaada')
      .replace('[Your Website URL]', 'https://www.udayaada.in/')
      .replace('[Your Support Email]', 'Udayaada.in')
      .replace('[Year]', new Date().getFullYear().toString());

    // Email details
    const mailOptions = {
      from: '"Udayaada" <orders@udayaada.in>', // Verified sender in ZeptoMail
      to: email,
      subject: '🎉 Welcome to Udayaada!',
      html: emailContent,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to: ${email}`);
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
  }
};
