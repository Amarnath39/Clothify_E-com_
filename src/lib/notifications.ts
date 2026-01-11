
// import { sendEmail } from "./email"; // Assuming an email helper exists, or we can use console.log for now

import { connectDB } from "../../db";
import Notification from "@/model/Notification";

export const sendAdminNotification = async (
    type: "LOW_STOCK" | "ORDER_PLACED" | "PAYMENT_FAILED" | "PAYMENT_INITIATED_NO_SUCCESS",
    data: any
) => {
    try {
        await connectDB();
        let message = "";

        switch (type) {
            case "LOW_STOCK":
                message = `⚠️ Low Stock: ${data.productName} (SKU: ${data.sku}). Available: ${data.availableStock}`;
                break;
            case "ORDER_PLACED":
                message = `✅ New Order #${data.orderId} by ${data.customerName} for ₹${data.amount}`;
                break;
            case "PAYMENT_FAILED":
                message = `❌ Payment Failed for Order #${data.orderId}. Reason: ${data.reason}`;
                break;
            case "PAYMENT_INITIATED_NO_SUCCESS":
                message = `⏳ Payment Pending for Order #${data.orderId}`;
                break;
            default:
                message = "New Notification";
        }

        await Notification.create({
            type,
            message,
            data
        });

        console.log(`[ADMIN NOTIFICATION SAVED] ${message}`);

    } catch (error) {
        console.error("Failed to save admin notification:", error);
    }
};

