import * as handlersModule from "../../packages/handlers/index";
import * as constantsModule from "../../packages/constants/index";
import type { Request, Response } from "express";

const { successHandler } = handlersModule;
const { CONSTANT } = constantsModule;

export const healthCheck = (_req: Request, res: Response) => {
  successHandler(
    {
      status: 200,
      message: CONSTANT.STATUS.SUCCESSFUL,
      data: { status: "ok" },
    },
    _req,
    res,
  );
};
