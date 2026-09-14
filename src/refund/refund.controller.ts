import type { NextFunction, Request, Response } from "express";
import { errorHandler, successHandler } from "../../packages/handlers";
import { CONSTANT } from "../../packages/constants";
import { isServiceError, parsePagination } from "../../packages/utils";
import type { PaginatedResult, PaginationQuery, RangeQuery } from "../../packages/utils";
import { refundService } from "./refund.services";
import type {
    ApiResponse,
    RefundBulkIdsRequest,
    RefundBulkStatusRequest,
    RefundCreateRequest,
    RefundListSummary,
    RefundResponse,
    RefundStatus,
} from "./refund.type";

export const createRefund = async (
    req: Request<{}, {}, RefundCreateRequest>,
    res: Response<ApiResponse<RefundResponse>>,
    next: NextFunction
) => {
    try {
        const data = await refundService.createRefund(req.body);

        if (isServiceError(data)) {
            return errorHandler(data, req, res);
        }

        return successHandler(
            { status: CONSTANT.HTTP_STATUS.CREATED, message: CONSTANT.PAYLOAD.RECORD_CREATED_SUCCESSFULLY, data },
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

export const readRefund = async (
    req: Request<{}, {}, {}, { refund_id: string }>,
    res: Response<ApiResponse<RefundResponse>>,
    next: NextFunction
) => {
    try {
        const data = await refundService.readRefund(req.query.refund_id);

        if (isServiceError(data)) {
            return errorHandler(data, req, res);
        }

        return successHandler(
            { status: CONSTANT.HTTP_STATUS.OK, message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY, data },
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

export const getAllRefunds = async (
    req: Request<{}, {}, {}, PaginationQuery & RangeQuery & { search?: string; status?: RefundStatus }>,
    res: Response<ApiResponse<PaginatedResult<RefundResponse> & { summary: RefundListSummary }>>,
    next: NextFunction
) => {
    try {
        const { page, limit, skip } = parsePagination(req.query);
        const data = await refundService.listRefunds({
            page,
            limit,
            skip,
            search: req.query.search,
            status: req.query.status,
            range: req.query.range,
            start_date: req.query.start_date,
            end_date: req.query.end_date,
        });

        if (isServiceError(data)) {
            return errorHandler(data, req, res);
        }

        return successHandler(
            { status: CONSTANT.HTTP_STATUS.OK, message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY, data },
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

export const updateRefundsStatus = async (
    req: Request<{}, {}, RefundBulkStatusRequest>,
    res: Response,
    next: NextFunction
) => {
    try {
        const data = await refundService.updateRefundsStatus(req.body.ids, req.body.status);

        if (isServiceError(data)) {
            return errorHandler(data, req, res);
        }

        return successHandler(
            { status: CONSTANT.HTTP_STATUS.OK, message: CONSTANT.PAYLOAD.RECORD_UPDATED_SUCCESSFULLY, data },
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

export const deleteRefund = async (
    req: Request<{}, {},RefundBulkIdsRequest>,
    res: Response,
    next: NextFunction
) => {
    try {
        const data = await refundService.deleteRefund(req.body.ids);

        if (isServiceError(data)) {
            return errorHandler(data, req, res);
        }

        return successHandler(
            { status: CONSTANT.HTTP_STATUS.OK, message: CONSTANT.PAYLOAD.RECORD_DELETED_SUCCESSFULLY, data },
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

export const hardDeleteRefunds = async (
    req: Request<{}, {}, RefundBulkIdsRequest>,
    res: Response,
    next: NextFunction
) => {
    try {
        const data = await refundService.hardDeleteRefunds(req.body.ids);

        if (isServiceError(data)) {
            return errorHandler(data, req, res);
        }

        return successHandler(
            { status: CONSTANT.HTTP_STATUS.OK, message: CONSTANT.PAYLOAD.RECORD_DELETED_SUCCESSFULLY, data },
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
