import mongoose from "mongoose";

const Address = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    address: {
      type: String,
    },
    mobile: {
      type: String,
    },
    country: {
      type: String,
    },
    state: {
      type: String,
    },
    addressType: {
      type: String,
    },
    zipCode: {
      type: Number,
    },
    city: {
      type: String,
    },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Address || mongoose.model("Address", Address);
