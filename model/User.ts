import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
      required: false
    },
    password: {
      type: String,
      required: false,
    },
    phone: {
      type: String,
    },
    otpSessionId: { type: String },

    updateEmail: {
      type: String,
    },
    emailOtp: { type: String },

    emailOtpExpiry: { type: Number },

    address: [
      {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "Address",
      },
    ],
    defaultAddress: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Address",
    },
    role: {
      type: String,
      default: "User",
    },
    otp: {
      type: Number,
    },
    otpExp: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
