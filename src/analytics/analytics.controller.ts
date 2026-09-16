import type { NextFunction, Request, Response } from "express";
import { errorHandler, successHandler } from "../../packages/handlers";
import { CONSTANT } from "../../packages/constants";
import { isServiceError } from "../../packages/utils";
import { analyticsService } from "./analytics.service";
import type { AnalyticsQuery, ApiResponse, RevenueOverviewResponse, StatsOverviewResponse } from "./analytics.type";

export const getStatsOverview = async (
    req: Request<{}, {}, {}, AnalyticsQuery>,
    res: Response<ApiResponse<StatsOverviewResponse>>,
    next: NextFunction
) => {
    try {
        const data = await analyticsService.getStatsOverview(req.query);

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

export const getRevenueOverview = async (
    req: Request<{}, {}, {}, AnalyticsQuery>,
    res: Response<ApiResponse<RevenueOverviewResponse>>,
    next: NextFunction
) => {
    try {
        const data = await analyticsService.getRevenueOverview(req.query);

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

export const getTopperformerproducts = async (req: Request<{}, {}, {}, AnalyticsQuery>, res: Response, next: NextFunction) => {

    try {
        const data = await analyticsService.getperfromingproduct(req.query);
        if (isServiceError(data)) {
            return errorHandler(data, req, res);
        }
        return successHandler(
            {
                status: CONSTANT.HTTP_STATUS.OK,
                message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY,
                data
            }, req, res
        )


    } catch (error) {
        return errorHandler({
            status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
            message: error instanceof Error ? error.message : CONSTANT.STATUS.SOMETHING_WENT_WRONG
        }, req, res)
    }

}
