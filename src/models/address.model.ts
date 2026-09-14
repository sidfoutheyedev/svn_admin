import mongoose from "mongoose";
import { CONSTANT } from "../../packages/constants";

const addressSchema = new mongoose.Schema(
    {
        address_id: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        user_id: {
            type: String,
            required: true,
            trim: true,
        },
        label: {
            type: String,
            default: null,
            trim: true,
        },
        full_name: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
            match: [CONSTANT.REGEX.PHONE, "please provide valid phone number"],
        },
        addressLine1: {
            type: String,
            required: true,
            trim: true,
        },
        addressLine2: {
            type: String,
            default: null,
            trim: true,
        },
        landmark: {
            type: String,
            default: null,
            trim: true,
        },
        city: {
            type: String,
            required: true,
            trim: true,
        },
        state: {
            type: String,
            required: true,
            trim: true,
        },
        country: {
            type: String,
            required: true,
            trim: true,
        },
        pincode: {
            type: String,
            required: true,
            trim: true,
        },
        is_default: {
            type: Boolean,
            default: false,
        },
        is_deleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

export const AddressModel = mongoose.model("Address", addressSchema);
