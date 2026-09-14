import * as handlersModule from '../../packages/handlers/index';
import * as managerModule from '../../packages/manager/index';
import type { Request, Response, NextFunction } from 'express';

const { errorHandler } = handlersModule;
const { logger } = managerModule;

export const errorMiddleware = (err: Error & { status?: number }, req: Request, res: Response, _next: NextFunction) => {
  logger.error(err.message || err);
  errorHandler({
    status: err.status || 500,
    message: err.message || "Internal server error",
  }, req, res);
};
