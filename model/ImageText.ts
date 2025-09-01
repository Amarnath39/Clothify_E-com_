import mongoose from "mongoose";

const ImageText = new mongoose.Schema({
    img: [{
        type: String,
    }],
    title: {
        type: String,
    },
    description: {
        type: String,
    },
    url: {
        type: String,
    },
}, {timestamps: true});

export default mongoose.models.ImageText || mongoose.model("ImageText", ImageText);