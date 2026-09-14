import mongoose from "mongoose";

const varientSchema = new mongoose.Schema({
    varient_id: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    varient_name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    varient_values: {
        type: [String],
        default: [],
    },
    is_deleted: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ["Live", "Draft", "Hidden"],
        default: "Live",
        required: true
    },
}, {
    timestamps: true
})

export const VarientModel = mongoose.model('Varient', varientSchema)