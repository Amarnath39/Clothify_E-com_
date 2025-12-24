import nodemailer from "nodemailer";

export const sendUserOrderEmail = async (order: any): Promise<{ success: boolean; message: string; error?: any }> => {
  // ✅ ADDED LOG: Log the incoming order object to check its structure
  console.log("--- DEBUG: Preparing to send email. Order data:", JSON.stringify(order, null, 2));

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.zeptomail.in",
      port: 587,
      auth: {
         user: "emailapikey", // replace with your ZeptoMail username/API key
        pass: "PHtE6r0OFO/qiGEq9kIA7ffpFsSmZN9/+79iJVFP44dAXPYAS01VrNEoxjfjqE0vXaZDEKWdnYtusOnNte6BJGy7NzkZW2qyqK3sx/VYSPOZsbq6x00YtF0fd0XaV4Hmdt5s1SfQv9jcNA==", // ZeptoMail API secret
      },
    });

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
        <p>Thank you for shopping with us! <br/>- <b>SIS TEAM</b></p>
      </div>
    `;

    console.log("--- DEBUG: Attempting to send email via ZeptoMail...");

    console.log({
      from: '"Siskerala" <orders@siskerala.com>', // Use a valid "from" address
      to: order.user?.email || order.customerEmail,
      subject: `✅ Payment Confirmed - Order #${order.orderId}`,
      html: htmlTemplate,
    });
    
    await transporter.sendMail({
      from: '"Siskerala" <orders@siskerala.com>', // Use a valid "from" address
      to: `${order.user?.email || order.customerEmail},sisbymridhulaparvathy@gmail.com`,
      subject: `✅ Payment Confirmed - Order #${order.orderId}`,
      html: htmlTemplate,
    });

    console.log("--- DEBUG: Email sent successfully via API.");
    
    return {
      success: true,
      message: `📧 Order confirmation email sent successfully to: ${order.customerEmail}`,
    };
  } catch (error: any) {
    // ✅ ADDED LOG: Log the full error object to see why it's failing
    console.error("--- DEBUG: FAILED TO SEND EMAIL. Full Error:", error);

    return {
      success: false,
      message: "❌ Failed to send confirmation email.",
      error: error.message || error,
    };
  }
};
