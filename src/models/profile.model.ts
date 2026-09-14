import mongoose from "mongoose";
import { CONSTANT } from "../../packages/constants";

const userProfile = new mongoose.Schema({
    profile_id: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    user_id: {
        type: String,
        required: true,
        unique: true,
    },
    full_name: {
        type: String,
        required: true,
        trim: true,
    },
    dob: {
        type: Date,
        required: true,
    },
    gender: {
        type: String,
        enum: ["male", "female", "others"],
        required: true,
    },
    profile_images: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        default: null,
        trim: true,
        match: [CONSTANT.REGEX.PHONE, "please provide valid phone number"]
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    new_brand_reminder: {
        type: Boolean,
        default: false
    },
    trend_reminder: {
        type: Boolean,
        default: false
    },
    more_reminder: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
})
export const UserProfileModel = mongoose.model("UserProfile", userProfile)