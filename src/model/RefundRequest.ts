import mongoose from "mongoose";

const RefundRequestSchema = new mongoose.Schema({
    orderId: {
        type: String, // Storing as String to match Order's orderId or ObjectId? Order.ts has _id as ObjectId but orderId as String. I should check which one I use.
        // Usually referencing _id is better.
        required: true
    },
    orderRef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    },
    type: {
        type: String,
        enum: ["REFUND", "EXCHANGE"],
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    condition: {
        type: String,
        enum: ["GOOD", "DAMAGED"],
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
        },
        sizeId: { type: String }, // To match Order's size._id
        quantity: { type: Number, required: true },
        amount: { type: Number, required: true }, // Refundable amount for this item
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["COMPLETED", "REJECTED"], // POS actions are immediate
        default: "COMPLETED"
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    },
    newInvoiceId: { type: String }, // For Exchange
}, { timestamps: true });

export default mongoose.models.RefundRequest || mongoose.model("RefundRequest", RefundRequestSchema);
