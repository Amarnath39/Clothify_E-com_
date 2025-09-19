import mongoose from "mongoose";

const Order = new mongoose.Schema(
  {
    orderId: { type: String },
    shippingCost: { type: Number },
    totalPrice: {
      type: Number,
    },
    payablePrice: {
      type: Number,
    },
    off: {
      type: Number,
    },
    shippingAddress: {
      type: Object,
    },
    productDetails: [
      {
        product: {
          type: Object,
        },
        size: {
          type: Object,
        },
        freeCount: {
          type: Number,
          default: 0,
        },
        count: {
          type: Number,
          default: 1,
        },
      },
    ],
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
    },
    transactionId: {
      type: String,
    },
    tempTransactionId: {
      type: String,
    },
    paymentStatus: {
      type: String,
      default: "NOT_INITIATED",
    },
    paymentMethod: {
      type: String,
    },
    currentStatus: {
      type: String,
      default: "CHECKOUT",
    },
    trackingId: {
      type: String,
    },
    deliveryPartner: {
      type: String,
    },
    invoiceId: {
      type: String,
    },
    exchangeReason: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Exchange",
    },
    orderSeq: {
      type: Number,
      required: true,
      default: 1, // Start from 0 or any initial value
    },
    date: {
      type: Date,
      default: null,
    },
    shiprocket: {
      type: Object,
      default: null,
    },

     dtdc: {
      referenceNumber: { type: String, default: null },
      customerReferenceNumber: { type: String, default: null },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", Order);
