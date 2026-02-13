import mongoose from "mongoose";

const HeroBanner = new mongoose.Schema({
    title: {
        type: String,
    },
    description: {
        type: String,
    },
    img: {
        type: String,
    },
    mobileImg: {
        type: String,
    },
    type: {
        type: String,
        enum: ["image", "video"],
        default: "image"
    },
    url: {
        type: String,
    },
    position: {
        type: Number,
        default: 0
    },
}, { timestamps: true });

export default mongoose.models.HeroBanner || mongoose.model("HeroBanner", HeroBanner);