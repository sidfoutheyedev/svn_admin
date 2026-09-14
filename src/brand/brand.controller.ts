import type { NextFunction, Request, Response } from "express";
import { errorHandler, successHandler } from "../../packages/handlers";
import { CONSTANT } from "../../packages/constants";
import { isServiceError, parsePagination } from "../../packages/utils";
import type { PaginatedResult, PaginationQuery, RangeQuery } from "../../packages/utils";
import { brandService } from "./brand.services";
import type {
    ApiResponse,
    BrandBulkIdsRequest,
    BrandBulkStatusRequest,
    BrandCreateRequest,
    BrandDetailResponse,
    BrandResponse,
    BrandUpdateRequest,
} from "./brand.type";

export const createBrand = async (
    req: Request<{}, {}, BrandCreateRequest>,
    res: Response<ApiResponse<BrandResponse>>,
    next: NextFunction
) => {
    try {
        const data = await brandService.createBrand(req.body);

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

export const updateBrand = async (
    req: Request<{}, {}, BrandUpdateRequest, { brand_id: string }>,
    res: Response<ApiResponse<BrandResponse>>,
    next: NextFunction
) => {
    try {
        const data = await brandService.updateBrand(req.query.brand_id, req.body);

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

export const deleteBrand = async (
    req: Request<{}, {}, BrandBulkIdsRequest>,
    res: Response<ApiResponse<BrandResponse>>,
    next: NextFunction
) => {
    try {
        const data = await brandService.deleteBrand(req.body.ids);

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

export const hardDeleteBrands = async (
    req: Request<{}, {}, BrandBulkIdsRequest>,
    res: Response,
    next: NextFunction
) => {
    try {
        const data = await brandService.hardDeleteBrands(req.body.ids);

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

export const updateBrandsStatus = async (
    req: Request<{}, {}, BrandBulkStatusRequest>,
    res: Response,
    next: NextFunction
) => {
    try {
        const data = await brandService.updateBrandsStatus(req.body.ids, req.body.status);

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

export const readBrand = async (
    req: Request<{}, {}, {}, { brand_id: string }>,
    res: Response<ApiResponse<BrandDetailResponse>>,
    next: NextFunction
) => {
    try {
        const query = req.query as typeof req.query & Partial<RangeQuery>;
        const data = await brandService.readBrand(query.brand_id, {
            range: query.range,
            start_date: query.start_date,
            end_date: query.end_date,
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

export const getAllBrand = async (
    req: Request<{}, {}, {}, PaginationQuery & RangeQuery & { brand_type?: string; status?: string }>,
    res: Response<ApiResponse<PaginatedResult<BrandResponse>>>,
    next: NextFunction 
) => {
    try {
        const { page, limit, skip } = parsePagination(req.query);
        const data = await brandService.listBrands({
            page,
            limit,
            skip,
            query: req.query.query,
            range: req.query.range,
            brand_type: req.query.brand_type,
            status : req.query.status
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
