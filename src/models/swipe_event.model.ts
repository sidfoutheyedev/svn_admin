import mongoose from "mongoose";

const swipeEventSchema = new mongoose.Schema(
  {
    swipe_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    user_id: {
      type: String,
      required: true,
      index: true,
    },

    product_id: {
      type: String,
      required: true,
      index: true,
    },

    direction: {
      type: String,
      enum: ["LEFT", "RIGHT", "TOP", "DOWN"],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

swipeEventSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

export const SwipeEventModel = mongoose.model("SwipeEvent", swipeEventSchema);
