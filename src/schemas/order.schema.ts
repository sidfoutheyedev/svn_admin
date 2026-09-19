import { z } from "zod";

const orderPaymentInputSchema = z.object({
    payment_mode: z.enum(["COD", "RAZORPAY"]),
    transaction_id: z.string().min(1).optional(),
    status: z.enum(["PENDING", "SUCCESS", "FAILED", "REFUNDED"]).optional(),
});

export const orderCreateSchema = z.object({
    user_id: z.string().min(1),
    address_id: z.string().min(1),
    products: z
        .array(
            z.object({
                product_variant_id: z.string().min(1),
                quantity: z.number().int().positive(),
            })
        )
        .min(1),
    payment: orderPaymentInputSchema.optional(),
});

const orderStatusEnum = z.enum([
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "RETURNED",
]);

export const orderBulkIdsSchema = z.object({
    ids: z.array(z.string().min(1)).min(1),
});

export const orderBulkStatusSchema = z.object({
    ids: z.array(z.string().min(1)).min(1),
    status: orderStatusEnum,
});
