import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

export const ItemModel = mongoose.model("Item", itemSchema);
