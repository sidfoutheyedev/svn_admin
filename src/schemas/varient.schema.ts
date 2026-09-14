import { z } from "zod";

export const varientSchema = z.object({
  varient_name: z.string().min(1),
  varient_values: z.array(z.string().min(1)).min(1),
  status: z.enum(["Draft", "Live", "Hidden"]).optional(),
});

export const varientUpdateSchema = varientSchema.partial();

export const varientBulkIdsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export const varientBulkStatusSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  status: z.enum(["Draft", "Live", "Hidden"]),
});
