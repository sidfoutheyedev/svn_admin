import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    product_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    product_name: {
      type: String,
      required: true,
      trim: true,
    },

    brand_id: {
      type: String,
      required: true,
      index: true,
    },

    category: {
      type: String,
      required: true,
      index: true,
    },

    sub_category: {
      type: String,
      required: true,
      index: true,
    },

    GST: {
      type: String,
      default: null,
    },

    product_description: {
      type: String,
      required: true,
      default: null,
    },

    product_type: {
      type: String,
      enum: ["PHYSICAL", "AFFILIATE"],
      required: true,
      default: "PHYSICAL",
      index: true,
    },

    gender: {
      type: String,
      enum: ["male", "female", "others"],
      required: true,
    },

    inventory_managed: {
      type: Boolean,
      default: true,
      index: true,
    },

    affiliate_link: {
      type: String,
      default: null,
      trim: true,
    },

    tag: {
      type: [String],
      default: [],
    },

    search_tag: {
      type: [String],
      default: [],
    },
    varient_ids: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["Live", "Draft", "Hidden"],
      default: "Live",
      required: true,
    },

    is_deleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },


  {
    timestamps: true,
  }
);

export const productModel = mongoose.model(
  "Product",
  ProductSchema
);
