import mongoose from "mongoose";

const Coupon = new mongoose.Schema({
    couponCode: {
        type: String,
        unique: true
    },
    description: {
        type: String,
    },
    validity: {
        type: Date,
    },
    type: {
        type: String,
    },
    off: {
        type: String,
    },
    userCount: {
        type: Number,
        default: 0
    },
    availableFor: {
        type: Number,
    },
    amount: {
        type: Number,
    },
    purchaseAmount: {
        type: Number,
    },
    visible: {
        type: Boolean,
        default: false
    },
    validOnCategories: [
        {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Category'
        }
    ],
    user: [
        {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User'
        }
    ],
    multiUse: {
        type: Boolean,
        default: false
    }
}, {timestamps: true});

export default mongoose.models.Coupon || mongoose.model("Coupon", Coupon);