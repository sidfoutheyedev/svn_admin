import mongoose from "mongoose";

const productSwipeStatsSchema = new mongoose.Schema(
  {
    product_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    left_swipe_count: {
      type: Number,
      default: 0,
    },

    right_swipe_count: {
      type: Number,
      default: 0,
    },

    rank_score: {
      type: Number,
      default: 0,
      index: true,
    },

    // TOP swipe — "view details" — a funnel/curiosity metric, not part of
    // the like/dislike ranking.
    view_count: {
      type: Number,
      default: 0,
    },

    cart_add_count: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const ProductSwipeStatModel = mongoose.model(
  "ProductSwipeStat",
  productSwipeStatsSchema,
);
