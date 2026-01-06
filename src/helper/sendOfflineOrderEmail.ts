import orderConfirmationEmail from "./orderConfirmationEmail";

interface OfflineOrderEmailParams {
    customerEmail: string;
    customerName: string;
    orderId: string;
    orderDetails: any;
    paymentMode: string;
    paymentStatus: string;
    shippingMethod: string;
    trackingId?: string;
}

export const sendOfflineOrderEmail = async (
    params: OfflineOrderEmailParams
): Promise<{ success: boolean; message: string; error?: any }> => {
    try {
        const {
            customerEmail,
            customerName,
            orderId,
            orderDetails,
            paymentMode,
            paymentStatus,
            shippingMethod,
            trackingId,
        } = params;

        // ✅ Build product list HTML
        let productsHtml = "";
        if (orderDetails.productDetails && orderDetails.productDetails.length > 0) {
            productsHtml = orderDetails.productDetails
                .map(
                    (item: any) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            ${item.sizeLabel || "N/A"} - Qty: ${item.count}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
            ₹${item.offerPrice?.toFixed(2) || "0.00"}
          </td>
        </tr>
      `
                )
                .join("");
        }

        // ✅ Build email HTML template for offline orders
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Order Confirmed!</h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 14px;">Thank you for your order</p>
            </td>
          </tr>

          <!-- Order Info -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #374151;">
                Dear <strong>${customerName}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                Your order has been successfully placed. Below are the details of your order:
              </p>

              <!-- Order Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 6px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Order ID:</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: bold; text-align: right;">${orderId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Payment Mode:</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${paymentMode}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Payment Status:</td>
                        <td style="padding: 8px 0; text-align: right;">
                          <span style="background-color: ${paymentStatus === "Paid" ? "#d1fae5" : "#fef3c7"
            }; color: ${paymentStatus === "Paid" ? "#065f46" : "#92400e"
            }; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">
                            ${paymentStatus}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Shipping Method:</td>
                        <td style="padding: 8px 0; color: #111827; font-size: 14px; text-align: right;">${shippingMethod}</td>
                      </tr>
                      ${trackingId
                ? `
                      <tr>
                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Tracking ID:</td>
                        <td style="padding: 8px 0; color: #3b82f6; font-size: 14px; text-align: right; font-weight: 600;">${trackingId}</td>
                      </tr>
                      `
                : ""
            }
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Products -->
              <h3 style="margin: 30px 0 15px 0; font-size: 18px; color: #111827;">Order Items</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px; text-align: left; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase;">Item</th>
                    <th style="padding: 12px; text-align: right; font-size: 12px; color: #6b7280; font-weight: 600; text-transform: uppercase;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${productsHtml}
                </tbody>
              </table>

              <!-- Total -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
                <tr>
                  <td style="padding: 12px 0; font-size: 14px; color: #6b7280;">Subtotal:</td>
                  <td style="padding: 12px 0; font-size: 14px; color: #111827; text-align: right;">₹${orderDetails.totalPrice?.toFixed(
                2
            )}</td>
                </tr>
                ${orderDetails.off > 0
                ? `
                <tr>
                  <td style="padding: 12px 0; font-size: 14px; color: #6b7280;">Discount:</td>
                  <td style="padding: 12px 0; font-size: 14px; color: #059669; text-align: right;">-₹${orderDetails.off.toFixed(
                    2
                )}</td>
                </tr>
                `
                : ""
            }
                <tr>
                  <td style="padding: 12px 0; font-size: 14px; color: #6b7280;">Shipping:</td>
                  <td style="padding: 12px 0; font-size: 14px; color: #111827; text-align: right;">₹${orderDetails.shippingCost?.toFixed(2) || "0.00"
            }</td>
                </tr>
                <tr style="border-top: 2px solid #e5e7eb;">
                  <td style="padding: 16px 0 0 0; font-size: 18px; color: #111827; font-weight: bold;">Total:</td>
                  <td style="padding: 16px 0 0 0; font-size: 18px; color: #111827; font-weight: bold; text-align: right;">₹${orderDetails.payablePrice?.toFixed(
                2
            )}</td>
                </tr>
              </table>

              <!-- Support -->
              <div style="margin-top: 30px; padding: 20px; background-color: #eff6ff; border-radius: 6px; border-left: 4px solid #3b82f6;">
                <p style="margin: 0; font-size: 14px; color: #1e40af; line-height: 1.6;">
                  <strong>Need Help?</strong><br>
                  If you have any questions about your order, please contact our support team.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">
                © ${new Date().getFullYear()} Siskerala. All rights reserved.
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #9ca3af;">
                This is an automated email. Please do not reply.
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

        // ✅ Send email using existing transport
        await orderConfirmationEmail(
            customerEmail,
            `Order Confirmation - ${orderId}`,
            htmlContent
        );

        console.log("✅ Offline order email sent to:", customerEmail);

        return {
            success: true,
            message: "Offline order email sent successfully",
        };
    } catch (error: any) {
        console.error("❌ Offline order email error:", error);
        return {
            success: false,
            message: "Failed to send offline order email",
            error: error.message,
        };
    }
};
