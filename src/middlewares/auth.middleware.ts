import { CONSTANT } from "../../packages/constants";
import * as handlersModule from "../../packages/handlers/index";
import * as authUtilModule from "../utils/auth";
import type { Request, Response, NextFunction } from "express";
import type { UserData } from "../auth/auth.type";

const { errorHandler } = handlersModule;
const { verifyToken } = authUtilModule;

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return errorHandler(
      {
        status: CONSTANT.HTTP_STATUS.UNAUTHORIZED,
        message: CONSTANT.STATUS.UNAUTHORIZED,
      },
      req,
      res,
    );
  }
  try {
    const decoded = verifyToken(token);
    if (typeof decoded === "string" || decoded.role !== "admin") {
      return errorHandler(
        {
          status: CONSTANT.HTTP_STATUS.UNAUTHORIZED,
          message: CONSTANT.STATUS.UNAUTHORIZED,
        },
        req,
        res,
      );
    }
    req.user = decoded as unknown as UserData;
    next();
  } catch (error) {
    return errorHandler(
      {
        status: CONSTANT.HTTP_STATUS.UNAUTHORIZED,
        message: error instanceof Error? error.message :CONSTANT.STATUS.INVALID_TOKEN,
      },
      req,
      res,
    );
  }
};
