import type { NextFunction, Request, Response } from "express";
import { errorHandler, successHandler } from "../../packages/handlers";
import { CONSTANT } from "../../packages/constants";
import { isServiceError, parsePagination } from "../../packages/utils";
import type { PaginatedResult, PaginationQuery } from "../../packages/utils";
import { varientService } from "./varient.services";
import type {
    ApiResponse,
    VarientBulkIdsRequest,
    VarientBulkStatusRequest,
    VarientCreateRequest,
    VarientListSummary,
    VarientResponse,
    VarientUpdateRequest,
} from "./varient.type";

export const createVarient = async (
    req: Request<{}, {}, VarientCreateRequest>,
    res: Response<ApiResponse<VarientResponse>>,
    next: NextFunction
) => {
    try {
        const data = await varientService.createVarient(req.body);

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
            res
        );
    } catch (error) {
        return errorHandler(
            {
                status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
                message: error instanceof Error ? error.message : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
            },
            req,
            res
        );
    }
};

export const updateVarient = async (
    req: Request<{}, {}, VarientUpdateRequest, { varient_id: string }>,
    res: Response<ApiResponse<VarientResponse>>,
    next: NextFunction
) => {
    try {
        const data = await varientService.updateVarient(req.query.varient_id, req.body);

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
            res
        );
    } catch (error) {
        return errorHandler(
            {
                status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
                message: error instanceof Error ? error.message : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
            },
            req,
            res
        );
    }
};

export const deleteVarient = async (
    req: Request<{}, {}, VarientBulkIdsRequest>,
    res: Response,
    next: NextFunction
) => {
    try {
        const data = await varientService.deleteVarient(req.body.ids);

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
            res
        );
    } catch (error) {
        return errorHandler(
            {
                status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
                message: error instanceof Error ? error.message : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
            },
            req,
            res
        );
    }
};

export const hardDeleteVarients = async (
    req: Request<{}, {}, VarientBulkIdsRequest>,
    res: Response,
    next: NextFunction
) => {
    try {
        const data = await varientService.hardDeleteVarients(req.body.ids);

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
            res
        );
    } catch (error) {
        return errorHandler(
            {
                status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
                message: error instanceof Error ? error.message : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
            },
            req,
            res
        );
    }
};

export const updateVarientsStatus = async (
    req: Request<{}, {}, VarientBulkStatusRequest>,
    res: Response,
    next: NextFunction
) => {
    try {
        const data = await varientService.updateVarientsStatus(req.body.ids, req.body.status);

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
            res
        );
    } catch (error) {
        return errorHandler(
            {
                status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
                message: error instanceof Error ? error.message : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
            },
            req,
            res
        );
    }
};

export const readVarient = async (
    req: Request<{}, {}, {}, { varient_id: string }>,
    res: Response<ApiResponse<VarientResponse>>,
    next: NextFunction
) => {
    try {
        const data = await varientService.readVarient(req.query.varient_id);

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
            res
        );
    } catch (error) {
        return errorHandler(
            {
                status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
                message: error instanceof Error ? error.message : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
            },
            req,
            res
        );
    }
};

export const getAllVarient = async (
    req: Request<{}, {}, {}, PaginationQuery & { status?: string }>,
    res: Response<ApiResponse<PaginatedResult<VarientResponse> & { summary: VarientListSummary }>>,
    next: NextFunction
) => {
    try {
        const { page, limit, skip } = parsePagination(req.query);
        const data = await varientService.listVarients({ page, limit, skip, query: req.query.query, status : req.query.status});

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
            res
        );
    } catch (error) {
        return errorHandler(
            {
                status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
                message: error instanceof Error ? error.message : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
            },
            req,
            res
        );
    }
};
