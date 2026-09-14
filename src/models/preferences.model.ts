import mongoose from "mongoose";
const preferencesModel = new mongoose.Schema(
  {
    preference_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category_id: {
      type: String,
      required: true,
      trim: true,
    },
    brand_ids: {
      type: [String],
      required: true,
    },
    priority: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    status: {
      type: String,
      enum: ["Draft", "Live", "Hidden"],
      default: "Draft",
      required: true,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

preferencesModel.index(
  { category_id: 1 },
  { unique: true, partialFilterExpression: { is_deleted: false } },
);

export const PreferencesModel = mongoose.model("Preferences", preferencesModel);
