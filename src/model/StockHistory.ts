import mongoose from "mongoose";

const StockHistorySchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        orderId: {
            type: String, // Changed to String to support custom IDs (ON-, POS-, etc.)
        },
        sizeId: {
            type: mongoose.Schema.Types.ObjectId, // If stock is tracked per size
        },
        sizeLabel: {
            type: String, // "S", "M", etc.
        },
        oldStock: {
            type: Number,
            required: true,
        },
        newStock: {
            type: Number,
            required: true,
        },
        changeAmount: {
            type: Number, // Negative for reduction, Positive for addition
            required: true,
        },
        action: {
            type: String,
            enum: ["SALE", "REFUND", "MANUAL_UPDATE", "CANCELLATION", "RESTOCK", "POS"],
            required: true,
        },
        reason: {
            type: String,
        },
        adminId: {
            type: String, // Changed to String to support "SYSTEM" or manual Admin IDs
        },
    },
    { timestamps: true }
);

export default mongoose.models.StockHistory || mongoose.model("StockHistory", StockHistorySchema);
