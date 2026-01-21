import nodemailer from "nodemailer";

export const sendShippingNotificationEmail = async (order: any): Promise<{ success: boolean; message: string; error?: any }> => {
  console.log("--- DEBUG: Sending shipping notification email. Order data:", JSON.stringify(order, null, 2));

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.zeptomail.in",
      port: 587,
      auth: {
        user: "emailapikey",
        pass: "PHtE6r0OFO/qiGEq9kIA7ffpFsSmZN9/+79iJVFP44dAXPYAS01VrNEoxjfjqE0vXaZDEKWdnYtusOnNte6BJGy7NzkZW2qyqK3sx/VYSPOZsbq6x00YtF0fd0XaV4Hmdt5s1SfQv9jcNA==",
      },
    });

    const trackingNumber = order.dtdc?.referenceNumber || 'Not Available';
    const customerName = order.shippingAddress?.name || 'Customer';

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4; padding:20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                
                <!-- Header with Logo -->
                <tr>
                  <td style="padding:30px; text-align:center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <img src="https://www.siskerala.com/assets/static/logo/SIS-LOGO.png" alt="SIS Kerala" style="height:80px; width:auto;"/>
                  </td>
                </tr>

                <!-- Shipping Icon -->
                <tr>
                  <td style="padding:40px 40px 20px; text-align:center;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width:80px; height:80px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; margin-bottom:20px;">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
                        <path d="M16 3h5v5M21 3l-7 7M4 20h.01M7 20h.01M10 20h.01M13 20h.01M16 20h.01M4 14h.01M7 14h.01M10 14h.01M13 14h.01M16 14h.01"/>
                      </svg>
                    </div>
                    <h2 style="margin:0; color:#333; font-size:28px;">Your Order Has Been Shipped! 📦</h2>
                  </td>
                </tr>

                <!-- Greeting -->
                <tr>
                  <td style="padding:20px 40px;">
                    <p style="margin:0; color:#666; font-size:16px; line-height:1.6; text-align:center;">
                      Dear <strong style="color:#333;">${customerName}</strong>,<br/><br/>
                      Great news! Your order has been dispatched and is on its way to you.
                    </p>
                  </td>
                </tr>

                <!-- Tracking Information Card -->
                <tr>
                  <td style="padding:0 40px 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f6f8fb 0%, #e9ecef 100%); border-radius:8px; border:2px solid #667eea;">
                      <tr>
                        <td style="padding:25px; text-align:center;">
                          <div style="margin-bottom:15px;">
                            <span style="color:#666; font-size:14px; display:block; margin-bottom:5px;">Order ID</span>
                            <strong style="color:#333; font-size:18px;">${order.orderId || order.tempTransactionId}</strong>
                          </div>
                          <div style="margin-bottom:15px;">
                            <span style="color:#666; font-size:14px; display:block; margin-bottom:5px;">Tracking Number (AWB)</span>
                            <strong style="color:#667eea; font-size:22px; letter-spacing:0.5px;">${trackingNumber}</strong>
                          </div>
                          <div>
                            <span style="color:#666; font-size:14px; display:block; margin-bottom:10px;">Delivery Partner</span>
                            <strong style="color:#333; font-size:18px;">DTDC Express</strong>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Track Order Button -->
                <tr>
                  <td style="padding:0 40px 30px; text-align:center;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://www.dtdc.com/in/" style="height:50px;v-text-anchor:middle;width:200px;" arcsize="10%" stroke="f" fillcolor="#667eea">
                      <w:anchorlock/>
                      <center>
                    <![endif]-->
                        <a href="https://www.dtdc.com/in/" target="_blank" style="background-color:#667eea; color:#ffffff; display:inline-block; font-family:sans-serif; font-size:16px; font-weight:bold; line-height:50px; text-align:center; text-decoration:none; width:200px; -webkit-text-size-adjust:none; border-radius:6px; box-shadow:0 4px 10px rgba(102,126,234,0.3);">
                          Track Your Order →
                        </a>
                    <!--[if mso]>
                      </center>
                    </v:roundrect>
                    <![endif]-->
                    <p style="margin:15px 0 0; color:#999; font-size:13px;">
                      Click the button above to track your shipment on DTDC's website
                    </p>
                  </td>
                </tr>

                <!-- Delivery Info -->
                <tr>
                  <td style="padding:0 40px 30px;">
                    <div style="background-color:#fff9e6; border-left:4px solid #ffc107; padding:15px; border-radius:4px;">
                      <p style="margin:0; color:#856404; font-size:14px; line-height:1.6;">
                        <strong>📍 Delivery Address:</strong><br/>
                        ${order.shippingAddress?.name}<br/>
                        ${order.shippingAddress?.address}<br/>
                        ${order.shippingAddress?.city}, ${order.shippingAddress?.state} ${order.shippingAddress?.zipCode}
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Expected Delivery -->
                <tr>
                  <td style="padding:0 40px 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#e8f5e9; border-radius:6px;">
                      <tr>
                        <td style="padding:20px; text-align:center;">
                          <span style="color:#2e7d32; font-size:14px; display:block; margin-bottom:5px;">⏱️ Expected Delivery</span>
                          <strong style="color:#1b5e20; font-size:16px;">3-5 Business Days</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:30px 40px; background-color:#f9f9f9; text-align:center; border-top:1px solid #eee;">
                    <p style="margin:0 0 15px; color:#666; font-size:14px;">
                      Thank you for shopping with <strong style="color:#333;">SIS Kerala</strong>!<br/>
                      We hope you love your purchase.
                    </p>
                    <p style="margin:20px 0 5px; color:#999; font-size:12px;">
                      Powered by <a href="https://www.webgeon.com" style="color:#667eea; text-decoration:none; font-weight:bold;" target="_blank">Webgeon Results</a>
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    console.log("--- DEBUG: Sending shipping notification email...");

    await transporter.sendMail({
      from: '"Swaarasya" <noreply@swaarasya.com>',
      to: `${order.user?.email || order.customerEmail},sisbymridhulaparvathy@gmail.com`,
      subject: `📦 Your Order Has Been Shipped! - Tracking #${trackingNumber}`,
      html: htmlTemplate,
    });

    console.log("--- DEBUG: Shipping notification email sent successfully.");

    return {
      success: true,
      message: `📧 Shipping notification email sent successfully to: ${order.customerEmail}`,
    };
  } catch (error: any) {
    console.error("--- DEBUG: FAILED TO SEND SHIPPING EMAIL. Error:", error);

    return {
      success: false,
      message: "❌ Failed to send shipping notification email.",
      error: error.message || error,
    };
  }
};
