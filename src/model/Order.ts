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
          type: mongoose.SchemaTypes.ObjectId,
          ref: "Product",
        },
        size: {
          _id: { type: mongoose.SchemaTypes.ObjectId },
          size: { type: String },
        },
        sizeLabel: { type: String },
        offerPrice: { type: Number },
        actualPrice: { type: Number },
        freeCount: {
          type: Number,
          default: 0,
        },
        count: {
          type: Number,
          default: 1,
        },
        stitchingId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Stitching",
          default: null,
        },
      },
    ],
    stitchingPrice: { type: Number, default: null },
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
    razorpayOrderId: { type: String, unique: true, sparse: true },
    paymentDetails: {
      initiatedAt: { type: Date },
      completedAt: { type: Date },
    },
    paymentStatus: {
      type: String,
      enum: [
        "NOT_INITIATED",
        "INITIATED",
        "PAYMENT_SUCCESS",
        "PAYMENT_PENDING",
        "PAYMENT_DECLINED",
        "PAYMENT_ERROR",
        "PAYMENT_CANCELLED",
        "PAYMENT_FAILED",
        "PAYMENT_AMOUNT_MISMATCH",
        "COD_PENDING",
      ],
      default: "NOT_INITIATED",
    },
    paymentError: { type: String, default: null },
    paymentLogs: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        details: Object,
      },
    ],
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
      default: 1800,
    },
    date: {
      type: Date,
      default: null,
    },
    stockUpdated: { type: Boolean, default: false },
    shiprocket: { type: Object, default: null },
    dtdc: {
      referenceNumber: { type: String },
      customerReferenceNumber: { type: String },
    },
    paypalOrderId: { type: String, unique: true, sparse: true },
    payerEmail: { type: String },
    paidAt: { type: Date },
    fulfillmentError: { type: String },
    // ✅ POS-specific fields
    order_type: {
      type: String,
      enum: ["normal", "prebooking", "POS", "OFFLINE"],
      default: "normal",
    },
    createdBy: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Admin",
      default: null,
    },
    metadata: {
      type: Object,
      default: null,
    },
    orderSource: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model("Order", Order);