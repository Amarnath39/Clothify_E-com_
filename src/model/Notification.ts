import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["LOW_STOCK", "ORDER_PLACED", "PAYMENT_FAILED", "PAYMENT_INITIATED_NO_SUCCESS", "OTHER"],
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        data: {
            type: Object, // Store related IDs (orderId, productId, etc.)
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 60 * 60 * 24 * 30, // Auto-delete after 30 days
        },
    },
    { timestamps: true }
);

export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
