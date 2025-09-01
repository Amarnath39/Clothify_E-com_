import mongoose from "mongoose";

const ScrollText = new mongoose.Schema({
    text: {
        type: String,
    }
}, {timestamps: true});

export default mongoose.models.ScrollText || mongoose.model("ScrollText", ScrollText);