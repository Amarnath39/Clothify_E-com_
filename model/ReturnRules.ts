import mongoose from "mongoose";

const ReturnRule = new mongoose.Schema({
    rule: {
        type: String,
    },
}, {timestamps: true});

export default mongoose.models.ReturnRule || mongoose.model("ReturnRule", ReturnRule);