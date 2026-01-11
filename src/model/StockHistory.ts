import mongoose from "mongoose";

const StockHistorySchema = new mongoose.Schema(
    {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
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
            enum: ["SALE", "REFUND", "MANUAL_UPDATE", "CANCELLATION", "RESTOCK"],
            required: true,
        },
        reason: {
            type: String,
        },
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin", // If changed manually by admin
        },
    },
    { timestamps: true }
);

export default mongoose.models.StockHistory || mongoose.model("StockHistory", StockHistorySchema);
