import type { NextFunction, Request, Response } from "express";
import { errorHandler, successHandler } from "../../packages/handlers";
import { CONSTANT } from "../../packages/constants";
import { isServiceError, parsePagination } from "../../packages/utils";
import type { PaginatedResult, PaginationQuery, RangeQuery } from "../../packages/utils";
import { orderService } from "./order.services";
import type {
    ApiResponse,
    OrderBulkIdsRequest,
    OrderBulkStatusRequest,
    OrderCreateRequest,
    OrderListItem,
    OrderListSummary,
    OrderResponse,
    OrderStatus,
} from "./order.type";

export const createOrder = async (
    req: Request<{}, {}, OrderCreateRequest>,
    res: Response<ApiResponse<OrderResponse>>,
    next: NextFunction
) => {
    try {
        const data = await orderService.createOrder(req.body);

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

export const readOrder = async (
    req: Request<{}, {}, {}, { order_id: string }>,
    res: Response<ApiResponse<OrderResponse>>,
    next: NextFunction
) => {
    try {
        const data = await orderService.readOrder(req.query.order_id);

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

export const getAllOrders = async (
    req: Request<{}, {}, {}, PaginationQuery & RangeQuery & { user_id?: string; status?: OrderStatus; search?: string }>,
    res: Response<ApiResponse<PaginatedResult<OrderListItem> & { summary: OrderListSummary }>>,
    next: NextFunction
) => {
    try {
        const { page, limit, skip } = parsePagination(req.query);
        const data = await orderService.listOrders({
            page,
            limit,
            skip,
            user_id: req.query.user_id,
            status: req.query.status,
            search: req.query.search,
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

export const updateOrdersStatus = async (
    req: Request<{}, {}, OrderBulkStatusRequest>,
    res: Response,
    next: NextFunction
) => {
    try {
        const data = await orderService.updateOrdersStatus(req.body.ids, req.body.status);

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

export const deleteOrder = async (
    req: Request<{}, {}, OrderBulkIdsRequest>,
    res: Response,
    next: NextFunction
) => {
    try {
        const data = await orderService.deleteOrder(req.body.ids);

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

export const hardDeleteOrders = async (
    req: Request<{}, {}, OrderBulkIdsRequest>,
    res: Response,
    next: NextFunction
) => {
    try {
        const data = await orderService.hardDeleteOrders(req.body.ids);

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
