import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        payment_id: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
        order_id: {
            type: String,
            required: true,
            index: true,
        },
        transaction_id: {
            type: String,
            default: null,
            trim: true,
            unique: true,
            sparse: true,
        },
        payment_mode: {
            type: String,
            enum: ["COD", "RAZORPAY"],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
            default: "PENDING",
            required: true,
            index: true,
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

export const PaymentModel = mongoose.model("Payment", paymentSchema);
