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
        pass: "PHtE6r1bEOHqgmV9oxUFtPW4R8atMIsp/+plJFJGsIlDXvVQSU0D/o0vkmCwo0gjA6JCQPWZyt9osezJ4enRJDu7NmlLVWqyqK3sx/VYSPOZsbq6x00esVkfc0LYXYTrcdNq0STfstrbNA=="
      }
    });

    // Load and prepare HTML email template
    const templatePath = path.join(process.cwd(), 'emailTemplate/subscribe-template.html');
    const template = fs.readFileSync(templatePath, 'utf-8');

    const emailContent = template
      .replaceAll('{{Your Company Name}}', 'Fancyvastra')
      .replace('[Your Website URL]', 'https://www.fancyvastra.com/')
      .replace('[Your Support Email]', 'customercare@fancyvastra.com')
      .replace('[Year]', new Date().getFullYear().toString());

    // Email details
    const mailOptions = {
      from: '"Roopsagar" <orders@roopsagarshoppingmall.com>', // Verified sender in ZeptoMail
      to: email,
      subject: '🎉 Welcome to Roopsagar!',
      html: emailContent,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to: ${email}`);
  } catch (error) {
    console.error('❌ Error sending welcome email:', error);
  }
};
