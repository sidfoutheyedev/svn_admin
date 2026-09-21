import { Request, Response, NextFunction } from "express";
import { CONSTANT } from "../../packages/manager";
import { errorHandler, successHandler } from "../../packages/handlers";
import { isServiceError, parsePagination } from "../../packages/utils";
import type { PaginationQuery, PaginatedResult } from "../../packages/utils";
import { preferencesService } from "./preferences.services";
import type {
  ApiResponse,
  preferencesCreateRequest,
  PreferencesResponse,
  PreferencesBulkIdsRequest
} from "./preferences.type";

export const getPreferencescontroller = async (
  req: Request<{}, {}, {}, PaginationQuery & {status? : string}>,
  res: Response<ApiResponse<PaginatedResult<PreferencesResponse>>>,
  next: NextFunction,
) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const data = await preferencesService.getPreferences({
      page,
      limit,
      skip,
      query: req.query.query,
      status: req.query.status,
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

export const createPreferencesController = async (
  req: Request<{}, {}, preferencesCreateRequest>,
  res: Response<ApiResponse<PreferencesResponse>>,
  next: NextFunction,
) => {
  try {
    const data = await preferencesService.createPreferences(req.body);

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

export const deletePreferencesController = async (
  req: Request < {}, {}, PreferencesBulkIdsRequest>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await preferencesService.deletePreferences(req.body.ids);

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

export const updatePreferencesController = async (
  req: Request<
    {},
    {},
    Partial<preferencesCreateRequest>,
    { preference_id: string }
  >,
  res: Response<ApiResponse<PreferencesResponse>>,
  next: NextFunction,
) => {
  try {
    const data = await preferencesService.updatePreferences(
      req.query.preference_id,
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

export const getPreferencesByIdController = async (
  req: Request<{}, {}, {}, { preference_id: string }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await preferencesService.getPreferencesById(
      req.query.preference_id,
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

export const updateMultiplePreferencesController = async (
  req: Request<
    {},
    {},
    { preference_ids: string[]; status: "Draft" | "Live" | "Hidden" }
  >,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await preferencesService.updateMultiplePreferences(
      req.body.preference_ids,
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
