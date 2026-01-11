import nodemailer from "nodemailer";

export const sendUserOrderEmail = async (order: any): Promise<{ success: boolean; message: string; error?: any }> => {
  console.log("--- DEBUG: Preparing to send email. Order data:", JSON.stringify(order, null, 2));

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.zeptomail.in",
      port: 587,
      auth: {
        user: "emailapikey",
        pass: "PHtE6r0OFO/qiGEq9kIA7ffpFsSmZN9/+79iJVFP44dAXPYAS01VrNEoxjfjqE0vXaZDEKWdnYtusOnNte6BJGy7NzkZW2qyqK3sx/VYSPOZsbq6x00YtF0fd0XaV4Hmdt5s1SfQv9jcNA==",
      },
    });

    // Build product list HTML
    const productsHTML = order.productDetails.map((item: any) => `
      <tr>
        <td style="padding:12px; border-bottom:1px solid #eee;">
          <div style="display:flex; align-items:center;">
            <div>
              <strong>${item.product?.name || 'Product'}</strong><br/>
              <span style="color:#666; font-size:14px;">₹${item.offerPrice} × ${item.count}</span><br/>
              <span style="color:#999; font-size:13px;">Size: ${item.sizeLabel} | Color: ${item.product?.color || 'N/A'}</span>
            </div>
          </div>
        </td>
        <td style="padding:12px; border-bottom:1px solid #eee; text-align:right;">
          <strong>₹${item.offerPrice * item.count}</strong>
        </td>
      </tr>
    `).join('');

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

                <!-- Greeting -->
                <tr>
                  <td style="padding:30px 40px 20px;">
                    <h2 style="margin:0; color:#333; font-size:24px;">Dear ${order.shippingAddress?.fullname || 'Customer'},</h2>
                    <p style="margin:15px 0 0; color:#666; font-size:16px; line-height:1.6;">
                      Your order has been placed successfully! Below are your purchased product details, pricing, and shipping address. Thank you for shopping.
                    </p>
                  </td>
                </tr>

                <!-- Order Details -->
                <tr>
                  <td style="padding:0 40px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f9f9; border-radius:6px; overflow:hidden;">
                      <tr>
                        <td style="padding:15px;">
                          <div style="font-size:14px; color:#666;">
                            Order ID: <strong style="color:#333;">${order.orderId || order.tempTransactionId}</strong>
                          </div>
                          <div style="font-size:14px; color:#666; margin-top:8px;">
                            Order Date: <strong style="color:#333;">${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Product Details -->
                <tr>
                  <td style="padding:0 40px 20px;">
                    <h3 style="margin:0 0 15px; color:#333; font-size:18px; border-bottom:2px solid #667eea; padding-bottom:10px;">Products</h3>
                    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee; border-radius:6px; overflow:hidden;">
                      ${productsHTML}
                    </table>
                  </td>
                </tr>

                <!-- Price Breakdown -->
                <tr>
                  <td style="padding:0 40px 20px;">
                    <h3 style="margin:0 0 15px; color:#333; font-size:18px; border-bottom:2px solid #667eea; padding-bottom:10px;">Price Breakdown</h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0; color:#666;">Subtotal</td>
                        <td style="padding:8px 0; text-align:right; color:#666;">₹${order.totalPrice}</td>
                      </tr>
                      ${order.off > 0 ? `
                      <tr>
                        <td style="padding:8px 0; color:#2ecc71;">Discounts</td>
                        <td style="padding:8px 0; text-align:right; color:#2ecc71;">-₹${order.off}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding:8px 0; color:#666;">Shipping</td>
                        <td style="padding:8px 0; text-align:right; color:#666;">₹${order.shippingCost || 0}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0 8px; border-top:2px solid #eee; font-size:18px; font-weight:bold; color:#333;">Total</td>
                        <td style="padding:12px 0 8px; border-top:2px solid #eee; text-align:right; font-size:18px; font-weight:bold; color:#667eea;">₹${order.payablePrice}</td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Shipping Address -->
                <tr>
                  <td style="padding:0 40px 20px;">
                    <h3 style="margin:0 0 15px; color:#333; font-size:18px; border-bottom:2px solid #667eea; padding-bottom:10px;">Shipping Address</h3>
                    <div style="padding:15px; background-color:#f9f9f9; border-radius:6px; color:#666; line-height:1.6;">
                      <strong style="color:#333;">${order.shippingAddress?.fullname}</strong><br/>
                      ${order.shippingAddress?.houseNumber}, ${order.shippingAddress?.area}<br/>
                      ${order.shippingAddress?.district}, ${order.shippingAddress?.state} ${order.shippingAddress?.pincode}<br/>
                      India<br/>
                      Phone: ${order.shippingAddress?.phoneNumber}
                    </div>
                  </td>
                </tr>

                <!-- Payment Status -->
                <tr>
                  <td style="padding:0 40px 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#d4edda; border:1px solid #c3e6cb; border-radius:6px;">
                      <tr>
                        <td style="padding:15px; text-align:center;">
                          <span style="color:#155724; font-size:16px;">
                            ✅ <strong>Payment Status: ${order.paymentStatus === 'PAYMENT_SUCCESS' ? 'CONFIRMED' : order.paymentStatus}</strong>
                          </span>
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
                      We will notify you once your order is shipped.
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

    console.log("--- DEBUG: Attempting to send email via ZeptoMail...");

    await transporter.sendMail({
      from: '"Siskerala" <orders@siskerala.com>',
      to: `${order.user?.email || order.customerEmail},sisbymridhulaparvathy@gmail.com`,
      subject: `✅ Order Confirmed - #${order.orderId || order.tempTransactionId} - SIS Kerala`,
      html: htmlTemplate,
    });

    console.log("--- DEBUG: Email sent successfully via API.");

    return {
      success: true,
      message: `📧 Order confirmation email sent successfully to: ${order.customerEmail}`,
    };
  } catch (error: any) {
    console.error("--- DEBUG: FAILED TO SEND EMAIL. Full Error:", error);

    return {
      success: false,
      message: "❌ Failed to send confirmation email.",
      error: error.message || error,
    };
  }
};
