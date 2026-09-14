import * as handlersModule from '../../packages/handlers/index';
import * as constantsModule from '../../packages/constants/index';
import type { Request, Response, NextFunction } from 'express';

const { errorHandler } = handlersModule;
const { CONSTANT } = constantsModule;

export const notFoundMiddleware = (_req: Request, res: Response, _next: NextFunction) => {
  errorHandler({
    status: 404,
    message: CONSTANT.STATUS.NOT_FOUND,
  }, _req, res);
};
