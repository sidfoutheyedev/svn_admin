import { z } from "zod";

export const preferenceSchema = z.object({
  preference_id: z.string().min(1),
  category_id: z.string().min(1),
  brand_ids: z.array(z.string()),
  priority: z.number().int().min(1).max(10),
  status: z.enum(["Draft", "Live", "Hidden"]).optional(),
  is_deleted: z.boolean().optional(),
});

export const preferencesCreateSchema = preferenceSchema.omit({
  preference_id: true,
  is_deleted: true,
});

export const preferencesUpdateSchema = preferenceSchema
  .omit({ preference_id: true, is_deleted: true })
  .partial();

export const preferencesBulkIdsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export const preferencesBulkStatusSchema = z.object({
  preference_ids: z.array(z.string().min(1)).min(1),
  status: z.enum(["Draft", "Live", "Hidden"]),
}); 