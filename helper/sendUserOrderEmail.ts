import nodemailer from "nodemailer";

export const sendUserOrderEmail = async (order: any): Promise<{ success: boolean; message: string; error?: any }> => {
  try {
    // ⚡ ZeptoMail transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.zeptomail.in",
      port: 587,
      auth: {
        user: "emailapikey", // replace with your ZeptoMail username/API key
        pass: "PHtE6r1ZF+3pjGd8p0IBtvfrE8amZI54rO5vKwREsYsRXqMGTE1cqI8rlWOyrxwjUPdGRv+Syohv5e6a4rjRJD7vPWZLW2qyqK3sx/VYSPOZsbq6x00Zs1kZdkPUXYLtc9Jt0iHfud/aNA==", // ZeptoMail API secret
      },
    });

    // HTML template
    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; padding:20px; border:1px solid #eee; border-radius:10px;">
        <h2 style="color:#2E86C1;">✅ Payment Confirmed!</h2>
        <p>Dear Customer,</p>
        <p>Your payment has been successfully received. Here are your order details:</p>

        <h3>📦 Order Summary</h3>
        <table style="width:100%; border-collapse: collapse;">
          <tr>
            <td style="padding:8px; border:1px solid #ddd;">Order ID</td>
            <td style="padding:8px; border:1px solid #ddd;">${order.orderId}</td>
          </tr>
          <tr>
            <td style="padding:8px; border:1px solid #ddd;">Transaction ID</td>
            <td style="padding:8px; border:1px solid #ddd;">${order.transactionId}</td>
          </tr>
          <tr>
            <td style="padding:8px; border:1px solid #ddd;">Amount Paid</td>
            <td style="padding:8px; border:1px solid #ddd;">₹${order.payablePrice}</td>
          </tr>
          <tr>
            <td style="padding:8px; border:1px solid #ddd;">Payment Status</td>
            <td style="padding:8px; border:1px solid #ddd; color:green;"><b>${order.paymentStatus}</b></td>
          </tr>
        </table>

        <p style="margin-top:20px;">We will process your order shortly and notify you once it is shipped. 🚚</p>

        <p>Thank you for shopping with us! <br/>- <b>Udayaada Team</b></p>
      </div>
    `;

    // Send email
    await transporter.sendMail({
      from: '"Udayaada" <orders@udayaada.in>',
      to: order.user?.email || order.customerEmail, // ensure email exists
      subject: `✅ Payment Confirmed - Order #${order.orderId}`,
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
