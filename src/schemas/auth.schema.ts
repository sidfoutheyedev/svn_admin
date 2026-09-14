import { z } from 'zod';

export const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const socialAuthSchema = z.object({
  idToken: z.string().min(1),
  provider: z.enum(['google', 'apple']),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8),
  confirm_password: z.string().min(8),
});

