import mongoose from "mongoose";

const Category = new mongoose.Schema({
    name: {
        type: String,
    },
    description: { type: String},
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
    }
}, {timestamps: true});

export default mongoose.models.Category || mongoose.model("Category", Category);