import jwt from 'jsonwebtoken';
import type { Request } from 'express';
import type { UserData } from '../auth/auth.type';

export const signToken = (payload: Record<string, unknown>) =>
  jwt.sign(payload, process.env.JWT_SECRET || "change_me", { expiresIn: "1d" });
export const verifyToken = (token: string) =>
  jwt.verify(token, process.env.JWT_SECRET || "change_me");

export const getAuthenticatedUserId = (req: Request): UserData | null => {
  const user: any = req.user;
  if (!user || typeof user === 'string' || typeof user.user_id !== 'string') {
    return null;
  }
  return user;
};

export const isProviderMatch = (actualSignInProvider: string | undefined, claimedProvider: 'google' | 'apple') =>
  actualSignInProvider === (claimedProvider === 'google' ? 'google.com' : 'apple.com');
