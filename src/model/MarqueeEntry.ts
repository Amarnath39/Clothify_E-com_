import mongoose from "mongoose";

const MarqueeEntrySchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true,
    },
}, { timestamps: true });

export default mongoose.models.MarqueeEntry || mongoose.model("MarqueeEntry", MarqueeEntrySchema);
