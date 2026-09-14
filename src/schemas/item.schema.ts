import { z } from 'zod';

export const itemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
});

export const itemUpdateSchema = itemSchema.partial();
