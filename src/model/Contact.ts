import mongoose from "mongoose";

const Contact = new mongoose.Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
    },
    mobile: {
        type: String,
    },
    description: {
        type: String,
    },
}, {timestamps: true});

export default mongoose.models.Contact || mongoose.model("Contact", Contact);