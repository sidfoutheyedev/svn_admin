import mongoose from "mongoose";

const ProductVariantSchema = new mongoose.Schema(
  {
    product_variant_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    product_id: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    variant_combination: {
      type: [String],
      default: [],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    discount_price: {
      type: Number,
      default: null,
      min: 0,
    },
    stock_on_hand: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    product_images: {
      type: [String],
      default: [],
    },
    is_default: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);
ProductVariantSchema.index({
  product_id: 1,
  is_active: 1,
});

/**
 * Export model
 */
export const productVariantModel = mongoose.model(
  "ProductVariant",
  ProductVariantSchema,
);
