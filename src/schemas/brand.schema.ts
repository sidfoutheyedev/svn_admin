import { z } from "zod";

export const brandSchema = z.object({
  brand_name: z.string().min(1),
  brand_image: z.string().min(1),
  brand_type: z.enum(["affiliate", "onboarding"]).optional(),
  brand_website: z.string().url().nullable().optional(),
  brand_affiliate_link: z.string().url().nullable().optional(),
  brand_tag: z.array(z.string().min(1)).min(1),
  brand_search_tag: z.array(z.string().min(1)).min(1),
  status: z.enum(["Draft", "Live", "Hidden"]).optional(),
});

export const brandUpdateSchema = brandSchema.partial();

export const brandBulkIdsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export const brandBulkStatusSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  status: z.enum(["Draft", "Live", "Hidden"]),
});
