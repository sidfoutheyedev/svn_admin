import * as handlersModule from '../../packages/handlers/index';
import type { Request, Response, NextFunction } from 'express';

const { errorHandler } = handlersModule;

export const validateBody = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return errorHandler({
      status: 400,
      message: result.error.errors.map((e: any) => e.message).join(", "),
    }, req, res);
  }
  req.body = result.data;
  next();
};
};
