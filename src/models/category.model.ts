import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    category_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category_name: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    parent_id: {
      type: String,
      default: null,
    },
    category_image: {
      type: String,
      trim: true,
      default: null,
      required: function (this: { parent_id?: string | null }) {
        return !this.parent_id;
      },
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
    category_description: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["Live", "Draft", "Hidden"],
      default: "Live",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const CategoryModel = mongoose.model("Category", categorySchema);
