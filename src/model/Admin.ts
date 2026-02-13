import mongoose from "mongoose";

const twoFASchema = new mongoose.Schema({
    enabled: { type: Boolean, default: false },
    secret: { type: String },        // encrypted TOTP secret
    tempSecret: { type: String },    // during setup
    backupCodes: [String],           // hashed backup codes
}, { _id: false });

const Admin = new mongoose.Schema({
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
    },

    twoFA: twoFASchema

}, { timestamps: true });

export default mongoose.models.Admin || mongoose.model("Admin", Admin);