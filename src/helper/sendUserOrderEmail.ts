import nodemailer from "nodemailer";

export const sendUserOrderEmail = async (
  order: any
): Promise<{ success: boolean; message: string; error?: any }> => {
  try {
    // ⚡ ZeptoMail transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.zeptomail.in",
      port: 587,
      auth: {
        user: "emailapikey", // replace with your ZeptoMail username/API key
        pass: "PHtE6r0NS+7qjDQm+xUG4/O+HpHxN9ws+r4yfVVD4oxFXPAEGE1dqdEjwWWz+RguUvFFQfGYnNpgtuvJ5urRIWe4M29ICWqyqK3sx/VYSPOZsbq6x00atlwadEHbUIDodtJo0iDQu9fbNA==", // ZeptoMail API secret
      },
    });

    // HTML template (Transaction ID removed)
    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; padding:20px; border:1px solid #eee; border-radius:10px;">
        <h2 style="color:#2E86C1;">✅ Order Confirmed!</h2>
        <p>Dear Customer,</p>
        <p>Your Order has been successfully received. Here are your order details:</p>

        <h3>📦 Order Summary</h3>
        <table style="width:100%; border-collapse: collapse;">
          <tr>
            <td style="padding:8px; border:1px solid #ddd;">Order ID</td>
            <td style="padding:8px; border:1px solid #ddd;">${order.orderId}</td>
          </tr>
          <tr>
            <td style="padding:8px; border:1px solid #ddd;">Price</td>
            <td style="padding:8px; border:1px solid #ddd;">₹${order.payablePrice}</td>
          </tr>
          <tr>
            <td style="padding:8px; border:1px solid #ddd;">Order Status</td>
            <td style="padding:8px; border:1px solid #ddd; color:green;"><b>${order.OrderStatus}</b></td>
          </tr>
        </table>

        <p style="margin-top:20px;">We will process your order shortly and notify you once it is shipped. 🚚</p>

        <p>Thank you for shopping with us! <br/>- <b>Jewel Essence Team</b></p>
      </div>
    `;

    // Send email
    await transporter.sendMail({
      from: '"Jewel Essence" <orders@thejewelessence.com>',
      to: order.user?.email || order.customerEmail, // ensure email exists
      subject: `✅ Order Confirmed - Order #${order.orderId}`,
      html: htmlTemplate,
    });

    return {
      success: true,
      message: `📧 Order confirmation email sent successfully to: ${order.user?.email || order.customerEmail}`,
    };
  } catch (error: any) {
    return {
      success: false,
      message: "❌ Failed to send confirmation email.",
      error: error.message || error,
    };
  }
};