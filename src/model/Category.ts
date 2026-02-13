import mongoose from "mongoose";

const Category = new mongoose.Schema({
    name: {
        type: String,
    },
    description: { type: String },
    img: {
        type: String,
    },
    parentCategory: [
        {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Category'
        }
    ],
    childCategory: [
        {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Category'
        }
    ],
    showInHome: {
        type: Boolean,
        default: false,
    },
    gst: {
        type: Number,
        default: 0
    },
    hsnCode: {
        type: String,
        default: null,
    },
    displayOrder: { // Added based on conversation history mentioning display order
        type: Number,
        default: 0,
    }
}, { timestamps: true });

export default mongoose.models.Category || mongoose.model("Category", Category);