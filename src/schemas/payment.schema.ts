import { z } from "zod";

const paymentStatusEnum = z.enum(["PENDING", "SUCCESS", "FAILED", "REFUNDED"]);
const paymentModeEnum = z.enum(["COD", "RAZORPAY"]);

export const paymentCreateSchema = z.object({
    order_id: z.string().min(1),
    amount: z.number().nonnegative(),
    payment_mode: paymentModeEnum,
    transaction_id: z.string().min(1).optional(),
    status: paymentStatusEnum.optional(),
});

export const paymentBulkIdsSchema = z.object({
    ids: z.array(z.string().min(1)).min(1),
});

export const paymentBulkStatusSchema = z.object({
    ids: z.array(z.string().min(1)).min(1),
    status: paymentStatusEnum,
});
