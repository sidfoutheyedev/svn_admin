import { z } from "zod";

export const categorySchema = z.object({
  category_name: z.string().min(1),
  parent_id: z.string().nullable().optional(),
  category_image: z.string().min(1),
  category_description: z.string().nullable().optional(),
  sub_category_names: z.array(z.string().min(1)).optional(),
  status: z.enum(["Draft", "Live", "Hidden"]).optional(),
});

export const categoryUpdateSchema = categorySchema.partial();

export const categoryBulkIdsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export const categoryBulkStatusSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  status: z.enum(["Draft", "Live", "Hidden"]),
});
