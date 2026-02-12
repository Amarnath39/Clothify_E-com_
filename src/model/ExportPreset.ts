import mongoose, { Schema, Types } from "mongoose";

const ExportPresetSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    // Filters JSON object
    filters: {
      type: Object,
      default: {},
    },

    // Selected Excel columns
    fields: {
      type: [String],
      default: [],
    },

    // Admin who created preset
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },

    // Optional: system default preset
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.ExportPreset ||
  mongoose.model("ExportPreset", ExportPresetSchema);
