import { z } from "zod";

export const userStatusSchema = z.object({
  user_ids: z.array(z.string().min(1)).min(1),
  status: z.enum(["active", "inactive", "suspended"]),
});

export const userRemoveSchema = z.object({
  user_ids: z.array(z.string().min(1)).min(1),
});
