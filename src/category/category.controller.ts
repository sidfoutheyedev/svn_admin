import type { NextFunction, Request, Response } from "express";
import { errorHandler, successHandler } from "../../packages/handlers";
import { CONSTANT } from "../../packages/constants";
import { isServiceError, parsePagination } from "../../packages/utils";
import type { PaginatedResult, PaginationQuery } from "../../packages/utils";
import { categoryService } from "./category.services";
import type {
  ApiResponse,
  CategoryBulkIdsRequest,
  CategoryBulkStatusRequest,
  CategoryCreateRequest,
  CategoryResponse,
  CategoryUpdateRequest,
} from "./category.type";

export const createCategory = async (
  req: Request<{}, {}, CategoryCreateRequest>,
  res: Response<ApiResponse<CategoryResponse>>,
  next: NextFunction,
) => {
  try {
    const data = await categoryService.createCategory(req.body);

    if (isServiceError(data)) {
      return errorHandler(data, req, res);
    }

    return successHandler(
      {
        status: CONSTANT.HTTP_STATUS.CREATED,
        message: CONSTANT.PAYLOAD.RECORD_CREATED_SUCCESSFULLY,
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

export const updateCategory = async (
  req: Request<{}, {}, CategoryUpdateRequest, { category_id: string }>,
  res: Response<ApiResponse<CategoryResponse>>,
  next: NextFunction,
) => {
  try {
    const data = await categoryService.updateCategory(
      req.query.category_id,
      req.body,
    );

    if (isServiceError(data)) {
      return errorHandler(data, req, res);
    }

    return successHandler(
      {
        status: CONSTANT.HTTP_STATUS.OK,
        message: CONSTANT.PAYLOAD.RECORD_UPDATED_SUCCESSFULLY,
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

export const deleteCategory = async (
  req: Request<{}, {}, CategoryBulkIdsRequest>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await categoryService.deleteCategory(req.body.ids);

    if (isServiceError(data)) {
      return errorHandler(data, req, res);
    }

    return successHandler(
      {
        status: CONSTANT.HTTP_STATUS.OK,
        message: CONSTANT.PAYLOAD.RECORD_DELETED_SUCCESSFULLY,
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

export const hardDeleteCategories = async (
  req: Request<{}, {}, CategoryBulkIdsRequest>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await categoryService.hardDeleteCategories(req.body.ids);

    if (isServiceError(data)) {
      return errorHandler(data, req, res);
    }

    return successHandler(
      {
        status: CONSTANT.HTTP_STATUS.OK,
        message: CONSTANT.PAYLOAD.RECORD_DELETED_SUCCESSFULLY,
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


export const updateCategoriesStatus = async (
  req: Request<{}, {}, CategoryBulkStatusRequest>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await categoryService.updateCategoriesStatus(
      req.body.ids,
      req.body.status,
    );

    if (isServiceError(data)) {
      return errorHandler(data, req, res);
    }

    return successHandler(
      {
        status: CONSTANT.HTTP_STATUS.OK,
        message: CONSTANT.PAYLOAD.RECORD_UPDATED_SUCCESSFULLY,
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

export const readCategory = async (
  req: Request<{}, {}, {}, { category_id: string }>,
  res: Response<ApiResponse<CategoryResponse>>,
  next: NextFunction,
) => {
  try {
    const data = await categoryService.readCategory(req.query.category_id);

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

export const getAllCategory = async (
  req: Request<{}, {}, {}, PaginationQuery & {status ? : string}>,
  res: Response<ApiResponse<PaginatedResult<CategoryResponse>>>,
  next: NextFunction,
) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const data = await categoryService.listCategories({
      page,
      limit,
      skip,
      query: req.query.query,
      status: req.query.status
    });

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
