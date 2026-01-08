import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    orderId: { type: String },

    totalPrice: { type: Number },
    payablePrice: { type: Number },
    off: { type: Number },
    shippingCost: { type: Number, default: 0 },
    couponCode: {
      type: String,
      default: null,
    },
    shippingAddress: {
      type: Object,
    },

    productDetails: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        sizeId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true, // The size _id inside product.sizes
        },
        sizeLabel: {
          type: String, // e.g., “S”, “M”, “L”
          required: true,
        },
        count: {
          type: Number,
          default: 1,
        },
        freeCount: {
          type: Number,
          default: 0,
        },
        actualPrice: {
          type: Number,
          required: true,
        },
        offerPrice: {
          type: Number,
          required: true,
        },
      },
    ],

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    transactionId: { type: String },
    tempTransactionId: { type: String },
    paymentStatus: {
      type: String,
      default: "NOT_INITIATED",
    },
    paymentMethod: { type: String },

    currentStatus: {
      type: String,
      default: "CHECKOUT",
    },

    trackingId: { type: String },
    deliveryPartner: { type: String },
    invoiceId: { type: String },

    exchangeReason: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exchange",
    },

    orderSeq: {
      type: Number,
      required: true,
      default: 1800,
    },

    date: { type: Date, default: null },

    dtdc: {
      referenceNumber: { type: String },
      customerReferenceNumber: { type: String },
    },

    // ✅ NEW: Optional fields for offline orders (backward-compatible)
    orderSource: {
      type: String,
      enum: ["ADMIN_OFFLINE"],
      // No default - undefined for online orders
    },

    createdByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // No required - only set for offline orders
    },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);