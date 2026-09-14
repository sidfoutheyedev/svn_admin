import mongoose from "mongoose";

const product_inventory = new mongoose.Schema(
  {
    product_variant_id: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["INBOUND", "OUTBOUND"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    reason: {
      type: String,
      enum: ["PURCHASE", "SALE", "CUSTOMER_RETURN", "STOCKS ADJUSTED"],
      required: true,
    },
    reference_id: {
      type: String,
      default: null,
      index: true,
    },
    reference_type: {
      type: String,
      enum: ["ORDER", "RETURN", "PURCHASE", "MANUAL"],
      default: null,
    },

    balance_after: {
      type: Number,
      required: true,
      min: 0,
    },
    idempotency_key: {
      type: String,
      required: true,
      unique: true,
    },
    performed_by: {
      type: String,
      default: null,
    },
    note: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

product_inventory.index({ product_variant_id: 1, createdAt: -1 });

export const inventoryModel = mongoose.model("Inventory", product_inventory);
