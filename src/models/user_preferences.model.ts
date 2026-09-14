import mongoose from "mongoose";

const userPreferencesSchema = new mongoose.Schema(
  {
    user_preference_id: {
      type: String,
      trim: true,
      unique: true,
      required: true,
    },

    user_id: {
      type: String,
      trim: true,
      unique: true,
      required: true,
    },

    preference_id: [
      {
        preference_id: {
          type: String,
          trim: true,
          required: true,
        },
        score: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("UserPreferences", userPreferencesSchema);
