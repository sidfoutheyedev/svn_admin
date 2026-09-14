import { z } from "zod";
import { CONSTANT } from "../../packages/constants";

export const profileSchema = z.object({
  full_name: z.string().min(1),
  dob: z.string().refine((value) => !isNaN(Date.parse(value)), "Invalid date"),
  gender: z.enum(["male", "female", "others"]),
  profile_images: z.string().nullable().optional(),
  phone: z.string().regex(CONSTANT.REGEX.PHONE, "please provide valid phone number").nullable().optional(),
  new_brand_reminder: z.boolean().optional(),
  trend_reminder: z.boolean().optional(),
  more_reminder: z.boolean().optional(),
});

export const profileUpdateSchema = profileSchema.partial();
