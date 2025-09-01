import mongoose from "mongoose";

const ZoomData = new mongoose.Schema({
    img: {
        type: String,
    },
    title: {
        type: String,
    },
}, {timestamps: true});

export default mongoose.models.ZoomData || mongoose.model("ZoomData", ZoomData);