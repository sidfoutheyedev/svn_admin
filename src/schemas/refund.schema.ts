import { z } from "zod";

const refundStatusEnum = z.enum(["REQUESTED", "APPROVED", "REJECTED", "PROCESSED"]);

export const refundCreateSchema = z.object({
    user_id: z.string().min(1),
    order_id: z.string().min(1),
    shipment_id: z.string().min(1).optional(),
    refund_remark: z.string().optional(),
});

export const refundBulkIdsSchema = z.object({
    ids: z.array(z.string().min(1)).min(1),
});

export const refundBulkStatusSchema = z.object({
    ids: z.array(z.string().min(1)).min(1),
    status: refundStatusEnum,
});
