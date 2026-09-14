import mongoose from "mongoose";

const refundSchema = new mongoose.Schema(
    {
        refund_id: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
        user_id: {
            type: String,
            required: true,
            index: true,
        },
        order_id: {
            type: String,
            required: true,
            index: true,
        },
        // Nullable — a refund can be requested for an order that was
        // cancelled before it ever shipped.
        shipment_id: {
            type: String,
            default: null,
        },
        refund_status: {
            type: String,
            enum: ["REQUESTED", "APPROVED", "REJECTED", "PROCESSED"],
            default: "REQUESTED",
            required: true,
            index: true,
        },
        refund_remark: {
            type: String,
            default: null,
            trim: true,
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

export const RefundModel = mongoose.model("Refund", refundSchema);
