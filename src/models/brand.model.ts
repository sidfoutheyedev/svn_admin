import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
  {
    brand_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    brand_name: {
      type: String,
      required: true,
      trim: true,
    },

    brand_image: {
      type: String,
      required: true,
      trim: true,
    },

    brand_type: {
      type: String,
      enum: ["affiliate", "onboarding"],
      default: "onboarding",
    },

    brand_website: {
      type: String,
      default: null,
      trim: true,
    },

    brand_affiliate_link: {
      type: String,
      default: null,
      trim: true,
    },

    brand_tag: {
      type: [String],
      required: true,
    },

    brand_search_tag: {
      type: [String],
      required: true,
    },

    is_deleted: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["Live", "Draft", "Hidden"],
      default: "Live",
      required: true
    },
  },
  {
    timestamps: true,
  }
);

export const BrandModel = mongoose.model("Brand", brandSchema);
