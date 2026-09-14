import mongoose from "mongoose";

const shipmentProductSchema = new mongoose.Schema(
    {
        product_id: { type: String, required: true },
        product_variant_id: { type: String, required: true },
        sku: { type: String, required: true },
        product_name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
    },
    { _id: false }
);

const shipmentSchema = new mongoose.Schema(
    {
        shipment_id: {
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
        payment_id: {
            type: String,
            default: null,
        },
        user_id: {
            type: String,
            required: true,
            index: true,
        },
        address_id: {
            type: String,
            required: true,
        },
        // Snapshotted from the order at shipment-creation time — see
        // order.model.ts's orderProductSchema comment for why.
        product_details: {
            type: [shipmentProductSchema],
            required: true,
        },
        tracking_number: {
            type: String,
            default: null,
            trim: true,
        },
        shipment_status: {
            type: String,
            enum: ["PENDING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED"],
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

export const ShipmentModel = mongoose.model("Shipment", shipmentSchema);
