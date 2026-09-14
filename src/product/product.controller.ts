import { NextFunction, Request, Response } from "express";
import { errorHandler, successHandler } from "../../packages/handlers";
import { CONSTANT } from "../../packages/constants";
import { isServiceError, parsePagination } from "../../packages/utils";
import type {
  PaginatedResult,
  PaginationQuery,
  RangeQuery,
} from "../../packages/utils";
import ProductServices from "./product.services";
import { buildSampleProductsCsv, buildProductsCsvExport } from "./product.csv";
import {
  ApiResponse,
  ProductBulkIdsRequest,
  ProductBulkStatusRequest,
  ProductCreateRequest,
  ProductDetail,
  ProductStatus,
  ProductUpdateRequest,
  ProductVariantBulkIdsRequest,
  ProductVariantInput,
  ProductVariantListItem,
  ProductVariantUpdateRequest,
} from "./product.type";

const createProductcontroller = async (
  req: Request<{}, {}, ProductCreateRequest>,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction,
) => {
  try {
    const data = await ProductServices.createProduct(req.body);

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

const updateProductcontroller = async (
  req: Request<{}, {}, ProductUpdateRequest, { product_id: string }>,
  res: Response<ApiResponse<ProductDetail>>,
  next: NextFunction,
) => {
  try {
    const data = await ProductServices.updateProduct(
      req.query.product_id,
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

const readProductcontroller = async (
  req: Request<{}, {}, {}, { product_id: string }>,
  res: Response<ApiResponse<ProductDetail>>,
  next: NextFunction,
) => {
  try {
    const data = await ProductServices.readProduct(req.query.product_id);

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

interface ListProductQuery extends PaginationQuery, RangeQuery {
  category_id?: string;
  status?: ProductStatus;
}

const readallProductcontroller = async (
  req: Request<{}, {}, {}, ListProductQuery>,
  res: Response<ApiResponse<PaginatedResult<ProductDetail>>>,
  next: NextFunction,
) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const data = await ProductServices.readAllproduct({
      page,
      limit,
      skip,
      category_id: req.query.category_id,
      query: req.query.query,
      status: req.query.status,
      range: req.query.range,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
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

const deleteSingleorMultiProductcontroller = async (
  req: Request<{}, {}, ProductBulkIdsRequest>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await ProductServices.hardDeleteProduct(req.body.ids);

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

const softDeleteProductcontroller = async (
  req: Request<{}, {}, ProductBulkIdsRequest>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await ProductServices.deleteProduct(req.body.ids);

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

const updateManyProductStatusController = async (
  req: Request<{}, {}, ProductBulkStatusRequest>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await ProductServices.updateManyProductStatus(
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

// product Varient CURD start

const createproductVarientcontroller = async (
  req: Request<{}, {}, ProductVariantInput, { product_id: string }>,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction,
) => {
  try {
    const data = await ProductServices.createProductVarient(
      req.query.product_id,
      req.body,
    );

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

const updateProductVarientcontroller = async (
  req: Request<
    {},
    {},
    ProductVariantUpdateRequest,
    { product_variant_id: string }
  >,
  res: Response<ApiResponse<unknown>>,
  next: NextFunction,
) => {
  try {
    const data = await ProductServices.updateProductVarient(
      req.query.product_variant_id,
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

const deleteproductVarientcontroller = async (
  req: Request<{}, {}, { product_variant_ids: string[] }>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await ProductServices.hardDeleteProductVarient(
      req.body.product_variant_ids,
    );

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

const softDeleteProductVarientcontroller = async (
  req: Request<{}, {}, ProductVariantBulkIdsRequest>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await ProductServices.deleteProductVarient(
      req.body.product_variant_ids,
    );

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

interface ListProductVariantQuery extends PaginationQuery {
  product_id?: string;
}

const getallProductVarientcontroller = async (
  req: Request<{}, {}, {}, ListProductVariantQuery>,
  res: Response<ApiResponse<PaginatedResult<ProductVariantListItem>>>,
  next: NextFunction,
) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const data = await ProductServices.getAllProductVarient({
      page,
      limit,
      skip,
      query: req.query.query,
      product_id: req.query.product_id,
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

// CSV Product

const sampleProductCSVcontroller = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const csv = buildSampleProductsCsv();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="products-sample.csv"',
    );
    return res.status(CONSTANT.HTTP_STATUS.OK).send(csv);
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

const createProductByCSVcontroller = async (
  req: Request & { file?: Express.Multer.File },
  res: Response<ApiResponse<unknown>>,
  next: NextFunction,
) => {
  try {
    if (!req.file) {
      return errorHandler(
        {
          status: CONSTANT.HTTP_STATUS.BAD_REQUEST,
          message: 'A CSV file is required (field name "file")',
        },
        req,
        res,
      );
    }

    const data = await ProductServices.bulkCreateProductsFromCsv(
      req.file.buffer,
    );

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

const getallProductByCSVcontroller = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const csv = await buildProductsCsvExport();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="products-export.csv"',
    );
    return res.status(CONSTANT.HTTP_STATUS.OK).send(csv);
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

export {
  createProductcontroller,
  updateProductcontroller,
  readProductcontroller,
  readallProductcontroller,
  deleteSingleorMultiProductcontroller,
  softDeleteProductcontroller,
  createproductVarientcontroller,
  updateProductVarientcontroller,
  deleteproductVarientcontroller,
  softDeleteProductVarientcontroller,
  getallProductVarientcontroller,
  updateManyProductStatusController,
  sampleProductCSVcontroller,
  createProductByCSVcontroller,
  getallProductByCSVcontroller,
};
