import type { NextFunction, Request, Response } from "express";
import { errorHandler, successHandler } from "../../packages/handlers";
import { CONSTANT } from "../../packages/constants";
import { isServiceError, parsePagination } from "../../packages/utils";
import type { PaginatedResult, PaginationQuery } from "../../packages/utils";
import { userService } from "./user.services";
import type {
    ApiResponse,
    UserDetailResponse,
    UserListItem,
    UserListSummary,
    UserRemoveRequest,
    UserStatus,
    UserStatusUpdateRequest,
} from "./user.type";

export const getAllUsers = async (
    req: Request<{}, {}, {}, PaginationQuery & { status?: UserStatus }>,
    res: Response<ApiResponse<PaginatedResult<UserListItem> & { summary: UserListSummary }>>,
    next: NextFunction
) => {
    try {
        const { page, limit, skip } = parsePagination(req.query);
        const data = await userService.listUsers({
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

export const updateUserStatus = async (
    req: Request<{}, {}, UserStatusUpdateRequest>,
    res: Response,
    next: NextFunction
) => {
    try {
        const data = await userService.updateUserStatus(req.body.user_ids, req.body.status);

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

export const removeUsers = async (
    req: Request<{}, {}, UserRemoveRequest>,
    res: Response,
    next: NextFunction
) => {
    try {
        const data = await userService.removeUsers(req.body.user_ids);

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

export const hardRemoveUsers = async (
    req: Request<{}, {}, UserRemoveRequest>,
    res: Response,
    next: NextFunction
) => {
    try {
        const data = await userService.hardRemoveUsers(req.body.user_ids);

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

export const getUserDetails = async (
    req: Request<{}, {}, {}, { user_id: string }>,
    res: Response<ApiResponse<UserDetailResponse>>,
    next: NextFunction
) => {
    try {
        const data = await userService.getUserDetails(req.query.user_id);

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

