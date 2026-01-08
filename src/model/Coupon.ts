import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema({
    couponCode: {
        type: String,
        unique: true,
        required: true,
        uppercase: true,
        trim: true
    },
    description: {
        type: String,
        default: ""
    },
    validity: {
        type: Date,
        required: true
    },
    type: {
        type: String,
        enum: ['percentage', 'flat'],
        required: true
    },
    off: {
        type: String,
        default: "0"
    },
    // OLD: userCount (current usage count)
    userCount: {
        type: Number,
        default: 0,
        min: 0
    },
    // OLD: availableFor (max usage limit)
    availableFor: {
        type: Number,
        required: true,
        min: 1
    },
    // OLD: amount (discount value)
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    // NEW: maxDiscount (only for percentage type)
    maxDiscount: {
        type: Number,
        default: null,
        min: 0
    },
    // OLD: purchaseAmount (min purchase amount)
    purchaseAmount: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    // OLD: visible (isVisible)
    visible: {
        type: Boolean,
        default: false
    },
    validOnCategories: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Category'
    }],
    // OLD: user (usedByUsers)
    user: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User'
    }],
    // OLD: multiUse (allowMultipleUsesPerUser)
    multiUse: {
        type: Boolean,
        default: false
    }
}, { 
    timestamps: true,
    toJSON: {
        transform: function(doc, ret) {
            // Always include maxDiscount in JSON responses (even if null)
            if (!ret.hasOwnProperty('maxDiscount')) {
                ret.maxDiscount = null;
            }
            return ret;
        }
    }
});

// Indexes
CouponSchema.index({ validity: 1 });
CouponSchema.index({ visible: 1 });

export default mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);