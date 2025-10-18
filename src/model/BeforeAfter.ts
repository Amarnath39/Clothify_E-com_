import mongoose from "mongoose";

const BeforeAfter = new mongoose.Schema({
    title: {
        type: String,
    },
    beforeImg: {
        type: String,
    },
    afterImg: {
        type: String,
    },
}, {timestamps: true});

export default mongoose.models.BeforeAfter || mongoose.model("BeforeAfter", BeforeAfter);