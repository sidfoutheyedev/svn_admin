import mongoose from "mongoose";

const Product_SKU = new mongoose.Schema({
  sku_unit_id: {
    type: String,
    unique: true,
    trim: true,
  },

  product_id: {
    type: String,
    trim: true,
    required: true,
  },
  product_varient_id: {
    type: String,
    trim: true,
    required: true,
  },
  sku_code: {
    type: String,
    trim: true,
    required: true,
  },
  is_sold: {
    type: Boolean,
    default: false
  },
  is_deleted: {
    type: Boolean,
    default: false
  }
}, {
    timestamps: true,
});


export const SKUModel = mongoose.model("sku_unit", Product_SKU);
