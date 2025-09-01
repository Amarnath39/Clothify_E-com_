import mongoose from "mongoose";

const Subscribe = new mongoose.Schema({
    email: {
        type: String,
    }
}, {timestamps: true});

export default mongoose.models.Subscribe || mongoose.model("Subscribe", Subscribe);