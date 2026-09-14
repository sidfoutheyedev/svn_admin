import type { UserData } from "../auth/auth.type";

declare global {
  namespace Express {
    interface Request {
      user?: UserData;
    }
  }
}

export {};
