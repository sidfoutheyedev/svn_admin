import mongoose from "mongoose";
import { CONSTANT } from "../../packages/constants/index";

const userSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [CONSTANT.REGEX.EMAIL, "Please provide a valid email address"],
    },

    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },

    password: {
      type: String,
      required: false,
      select: false,
    },
    provider: {
      type: String,
      enum: ["local", "google", "apple"],
      default: "local",
    },

    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
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

export const UserModel = mongoose.model("User", userSchema);
