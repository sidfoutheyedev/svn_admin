import mongoose from "mongoose";

const orderProductSchema = new mongoose.Schema(
    {
        product_id: { type: String, required: true },
        product_variant_id: { type: String, required: true },
        // The exact unit codes claimed for this line (length === quantity),
        // matching the per-unit sku catalog in SKUModel.
        sku: { type: [String], default: [] },
        product_name: { type: String, required: true },
        // GST percentage snapshotted from the product at order time.
        GST: { type: String, default: null },
        variant_combination: { type: [String], default: [] },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
        discount_price: { type: Number, default: null, min: 0 },
        line_total: { type: Number, required: true, min: 0 },
        inventory_managed: { type: Boolean, required: true },
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        order_id: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
        order_number: {
            type: String,
            required: true,
            unique: true,
            trim: true,
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
        products: {
            type: [orderProductSchema],
            required: true,
            validate: {
                validator: (value: unknown[]) => value.length > 0,
                message: "An order must have at least one product",
            },
        },
        // Total units across every line (sum of products[].quantity).
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        // Payable amount after discount (sum of products[].line_total).
        total_price: {
            type: Number,
            required: true,
            min: 0,
        },
        // Total amount saved via discounts (pre-discount subtotal minus
        // total_price), not a per-unit price.
        discount_price: {
            type: Number,
            default: 0,
            min: 0,
        },
        // Sum of each line's (line_total * GST% / 100), snapshotted at order time.
        tax_total: {
            type: Number,
            default: 0,
            min: 0,
        },
        status: {
            type: String,
            enum: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"],
            default: "PENDING",
            required: true,
            index: true,
        },
        payment_id: {
            type: String,
            default: null,
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

export const OrderModel = mongoose.model("Order", orderSchema);
