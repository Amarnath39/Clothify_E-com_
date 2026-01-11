
// import { sendEmail } from "./email"; // Assuming an email helper exists, or we can use console.log for now

export const sendAdminNotification = async (
    type: "LOW_STOCK" | "ORDER_PLACED" | "PAYMENT_FAILED" | "PAYMENT_INITIATED_NO_SUCCESS",
    data: any
) => {
    try {
        console.log(`[ADMIN NOTIFICATION] Type: ${type}`, data);

        switch (type) {
            case "LOW_STOCK":
                // TODO: Implement actual email/SMS alert to admin
                // await sendEmail({ to: process.env.ADMIN_EMAIL, subject: "Low Stock Alert", body: ... })
                console.warn(`⚠️ LOW STOCK ALERT: Product ${data.productName} (SKU: ${data.sku}) has ${data.availableStock} items left.`);
                break;

            case "ORDER_PLACED":
                console.info(`✅ New Order Placed: #${data.orderId} by ${data.customerName} for ₹${data.amount}`);
                break;

            case "PAYMENT_FAILED":
                console.error(`❌ Payment Failed for Order #${data.orderId}. Reason: ${data.reason}`);
                break;

            case "PAYMENT_INITIATED_NO_SUCCESS":
                console.warn(`⏳ Payment Initiated but not completed for Order #${data.orderId}`);
                break;
        }
    } catch (error) {
        console.error("Failed to send admin notification:", error);
    }
};
