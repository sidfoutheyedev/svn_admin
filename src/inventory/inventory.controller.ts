import type { NextFunction, Request, Response } from "express";
import { errorHandler, successHandler } from "../../packages/handlers";
import { CONSTANT } from "../../packages/constants";
import { isServiceError, parsePagination } from "../../packages/utils";
import type { PaginationQuery, RangeQuery } from "../../packages/utils";
import { inventoryService } from "./inventory.services";
import type { ApiResponse } from "./inventory.type";

export const getVariantStock = async (
  req: Request<{}, {}, {}, { product_variant_id: string }>,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction,
) => {
  try {
    const data = await inventoryService.getVariantStock(
      req.query.product_variant_id,
    );

    if (isServiceError(data)) {
      return errorHandler(data, req, res);
    }

    return successHandler(
      {
        status: CONSTANT.HTTP_STATUS.OK,
        message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
        data,
      },
      req,
      res,
    );
  } catch (error) {
    return errorHandler(
      {
        status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message:
          error instanceof Error
            ? error.message
            : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
      },
      req,
      res,
    );
  }
};

export const listInventory = async (
  req: Request<{}, {}, {}, PaginationQuery & RangeQuery & { status?: string }>,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction,
) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const data = await inventoryService.listInventory(
      { page, limit, skip },
      { query: req.query.query, status: req.query.status },
      {
        range: req.query.range,
        start_date: req.query.start_date,
        end_date: req.query.end_date,
      },
    );

    if (isServiceError(data)) {
      return errorHandler(data, req, res);
    }

    return successHandler(
      {
        status: CONSTANT.HTTP_STATUS.OK,
        message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
        data,
      },
      req,
      res,
    );
  } catch (error) {
    return errorHandler(
      {
        status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message:
          error instanceof Error
            ? error.message
            : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
      },
      req,
      res,
    );
  }
};

interface ListMovementsQuery extends PaginationQuery {
  product_variant_id?: string;
}

export const listMovements = async (
  req: Request<{}, {}, {}, ListMovementsQuery>,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction,
) => {
  try {
    if (!req.query.product_variant_id) {
      return errorHandler(
        {
          status: CONSTANT.HTTP_STATUS.BAD_REQUEST,
          message: "product_variant_id is required",
        },
        req,
        res,
      );
    }

    const { page, limit, skip } = parsePagination(req.query);
    const data = await inventoryService.listMovements(
      req.query.product_variant_id,
      { page, limit, skip },
    );

    if (isServiceError(data)) {
      return errorHandler(data, req, res);
    }

    return successHandler(
      {
        status: CONSTANT.HTTP_STATUS.OK,
        message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
        data,
      },
      req,
      res,
    );
  } catch (error) {
    return errorHandler(
      {
        status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message:
          error instanceof Error
            ? error.message
            : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
      },
      req,
      res,
    );
  }
};
