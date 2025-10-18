import mongoose from "mongoose";

const Instagram = new mongoose.Schema({
    fileLink: {
        type: String,
    },
    fileType: {
        type: String,
        default: "Image"
    },
    url: {
        type: String,
    },
}, {timestamps: true});

export default mongoose.models.Instagram || mongoose.model("Instagram", Instagram);