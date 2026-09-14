import type { NextFunction, Request, Response } from "express";
import { errorHandler, successHandler } from "../../packages/handlers";
import { CONSTANT } from "../../packages/constants";
import { isServiceError, parsePagination } from "../../packages/utils";
import type { PaginatedResult, PaginationQuery } from "../../packages/utils";
import { paymentService } from "./payment.services";
import type {
    ApiResponse,
    PaymentBulkIdsRequest,
    PaymentBulkStatusRequest,
    PaymentCreateRequest,
    PaymentResponse,
    PaymentStatus,
} from "./payment.type";

export const createPayment = async (
    req: Request<{}, {}, PaymentCreateRequest>,
    res: Response<ApiResponse<PaymentResponse>>,
    next: NextFunction
) => {
    try {
        const data = await paymentService.createPayment(req.body);

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

export const readPayment = async (
    req: Request<{}, {}, {}, { payment_id: string }>,
    res: Response<ApiResponse<PaymentResponse>>,
    next: NextFunction
) => {
    try {
        const data = await paymentService.readPayment(req.query.payment_id);

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

export const getAllPayments = async (
    req: Request<{}, {}, {}, PaginationQuery & { order_id?: string; status?: PaymentStatus }>,
    res: Response<ApiResponse<PaginatedResult<PaymentResponse>>>,
    next: NextFunction
) => {
    try {
        const { page, limit, skip } = parsePagination(req.query);
        const data = await paymentService.listPayments({
            page,
            limit,
            skip,
            order_id: req.query.order_id,
            status: req.query.status,
            query: req.query.query,
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

export const updatePaymentsStatus = async (
    req: Request<{}, {}, PaymentBulkStatusRequest>,
    res: Response,
    next: NextFunction
) => {
    try {
        const data = await paymentService.updatePaymentsStatus(req.body.ids, req.body.status);

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

export const deletePayment = async (
    req: Request<{}, {}, PaymentBulkIdsRequest>,
    res: Response<ApiResponse<PaymentResponse>>,
    next: NextFunction
) => {
    try {
        const data = await paymentService.deletePayment(req.body.ids);

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

export const hardDeletePayments = async (
    req: Request<{}, {}, PaymentBulkIdsRequest>,
    res: Response,
    next: NextFunction
) => {
    try {
        const data = await paymentService.hardDeletePayments(req.body.ids);

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
