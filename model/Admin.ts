import mongoose from "mongoose";

const Admin  = new mongoose.Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
    },
    password: {
        type: String,
    },
    role: {
        type: String,
        enum: ["Sales person", "Admin", "SuperAdmin"],
        default: 'Admin'
    },
    otp: {
        type: Number,
    },
    otpExp: {
        type: Date
    }
}, { timestamps: true });

export default mongoose.models.Admin || mongoose.model("Admin", Admin);