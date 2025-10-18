import mongoose from "mongoose";

const Product = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    sku: { type: String, unique: true },
    img: [
      {
        type: String,
      },
    ],
    description: {
      type: String,
    },
    actualPrice: {
      type: Number,
    },

    off: {
      type: Number,
    },

    sellCount: {
      type: Number,
      default: 0,
    },
    width: {
      type: String,
    },
    height: {
      type: String,
    },
    material: [
      {
        type: String,
      },
    ],
    blousePiece: {
      type: String,
    },
    washCare: {
      type: String,
    },
    note: {
      type: String,
    },
    color: {
      type: String,
    },
    colors: [
      {
        color: {
          type: String,
        },
        varientId: {
          type: mongoose.SchemaTypes.ObjectId,
          ref: "Product",
        },
      },
    ],
    categories: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "Category",
      },
    ],
    offers: [
      {
        purchaseQuantity: { type: Number },
        freeQuantity: { type: Number },
        products: [
          {
            type: Object,
          },
        ],
        status: {
          type: String,
          enum: ["Active", "Inactive"],
          default: "Active",
        },
      },
    ],
    featureProduct: {
      type: Boolean,
      default: false,
    },
    latestProduct: {
      type: Boolean,
      default: false,
    },
    bestsellerProduct: {
      type: Boolean,
      default: false,
    },
    sizes: [
      {
        size: {
          type: String,
        },
        stock: {
          type: Number,
        },
        sellCount: {
          type: Number,
          default: 0,
        },
        offerPrice: {
          type: Number,
        },
        deliveryPrice: {
          type: Number,
        },
      },
    ],
    rating: {
      star: {
        type: Number,
        default: 4,
      },
      ratedBy: {
        type: Number,
        default: 1,
      },
    },
    additionalFields: { type: Object },
    returnRules: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "ReturnRule",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model("Product", Product);
