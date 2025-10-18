import mongoose from "mongoose";

const ZipCheck = new mongoose.Schema(
  {
    place: {
      type: String,
    },
    zipcode: {
      type: Number,
    },
  },
  { timestamps: true }
);

export default mongoose.models.ZipCheck || mongoose.model("ZipCheck", ZipCheck);
