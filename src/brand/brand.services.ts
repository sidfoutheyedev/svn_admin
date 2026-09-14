import { randomBytes } from "crypto";
import { CONSTANT } from "../../packages/constants";
import {
  buildPaginatedResult,
  resolveWindows,
  toMetric,
} from "../../packages/utils";
import type { PaginationParams, RangeQuery } from "../../packages/utils";
import { BrandModel } from "../models/brand.model";
import { productModel } from "../models/product.model";
import { OrderModel } from "../models/order.model";
import type {
  BrandCreateRequest,
  BrandUpdateRequest,
  BrandListItem,
  BrandListSummary,
  BrandPerformance,
} from "./brand.type";

const findBrandByName = (brand_name: string) =>
  BrandModel.findOne({ brand_name, is_deleted: false });

const createBrand = async (payload: BrandCreateRequest) => {
  try {
    const existing = await findBrandByName(payload.brand_name);

    if (existing) {
      return {
        status: CONSTANT.HTTP_STATUS.CONFLICT,
        message: CONSTANT.PAYLOAD.RECORD_ALREADY_EXIST,
      };
    }

    const brand = await BrandModel.create({
      brand_id: randomBytes(6).toString("hex"),
      brand_name: payload.brand_name,
      brand_image: payload.brand_image,
      brand_type: payload.brand_type ?? "onboarding",
      brand_website: payload.brand_website ?? null,
      brand_affiliate_link: payload.brand_affiliate_link ?? null,
      brand_tag: payload.brand_tag,
      brand_search_tag: payload.brand_search_tag,
      status: payload.status ?? "Live",
    });

    return brand;
  } catch (error) {
    return {
      status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message:
        error instanceof Error
          ? error.message
          : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
    };
  }
};

const updateBrand = async (brand_id: string, payload: BrandUpdateRequest) => {
  try {
    const brand = await BrandModel.findOneAndUpdate(
      { brand_id, is_deleted: false },
      payload,
      { new: true, runValidators: true },
    );

    if (!brand) {
      return {
        status: CONSTANT.HTTP_STATUS.NOT_FOUND,
        message: CONSTANT.STATUS.NOT_FOUND,
      };
    }

    return brand;
  } catch (error) {
    return {
      status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message:
        error instanceof Error
          ? error.message
          : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
    };
  }
};

const deleteBrand = async (ids: string[]) => {
  try {
    if (!ids?.length) {
      return {
        status: CONSTANT.HTTP_STATUS.BAD_REQUEST,
        message: "Brand IDs are required",
      };
    }

    const result = await BrandModel.updateMany(
      {
        brand_id: { $in: ids },
        is_deleted: false,
      },
      {
        $set: {
          is_deleted: true,
        },
      },
    );

    if (result.modifiedCount === 0) {
      return {
        status: CONSTANT.HTTP_STATUS.NOT_FOUND,
        message: CONSTANT.STATUS.NOT_FOUND,
      };
    }

    return { deleted: result.modifiedCount };
  } catch (error) {
    return {
      status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message:
        error instanceof Error
          ? error.message
          : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
    };
  }
};

const hardDeleteBrands = async (ids: string[]) => {
  try {
    const result = await BrandModel.deleteMany({ brand_id: { $in: ids } });

    return { deleted: result.deletedCount };
  } catch (error) {
    return {
      status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message:
        error instanceof Error
          ? error.message
          : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
    };
  }
};

const updateBrandsStatus = async (
  ids: string[],
  status: BrandUpdateRequest["status"],
) => {
  try {
    const result = await BrandModel.updateMany(
      { brand_id: { $in: ids }, is_deleted: false },
      { status },
    );

    return { updated: result.modifiedCount };
  } catch (error) {
    return {
      status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message:
        error instanceof Error
          ? error.message
          : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
    };
  }
};

// Revenue and units sold for a single brand within a window — mirrors
// revenueFor's product->brand lookup but scoped to one brand up front.
const brandPerformanceFor = async (
  brand_id: string,
  start: Date,
  end: Date,
) => {
  const [result] = await OrderModel.aggregate([
    {
      $match: {
        is_deleted: false,
        status: { $nin: ["CANCELLED", "RETURNED"] },
        createdAt: { $gte: start, $lt: end },
      },
    },
    { $unwind: "$products" },
    {
      $lookup: {
        from: productModel.collection.name,
        localField: "products.product_id",
        foreignField: "product_id",
        as: "productDoc",
      },
    },
    { $unwind: "$productDoc" },
    { $match: { "productDoc.brand_id": brand_id } },
    {
      $group: {
        _id: null,
        revenue: { $sum: "$products.line_total" },
        productsSold: { $sum: "$products.quantity" },
      },
    },
  ]);

  return {
    revenue: result?.revenue ?? 0,
    productsSold: result?.productsSold ?? 0,
  };
};

const readBrand = async (brand_id: string, rangeQuery: RangeQuery) => {
  try {
    const brand = await BrandModel.findOne({
      brand_id,
      is_deleted: false,
    }).lean();

    if (!brand) {
      return {
        status: CONSTANT.HTTP_STATUS.NOT_FOUND,
        message: CONSTANT.STATUS.NOT_FOUND,
      };
    }

    const { currentStart, currentEnd, previousStart, previousEnd } =
      resolveWindows(rangeQuery);

    const [currentPerf, previousPerf, totalProduct] = await Promise.all([
      brandPerformanceFor(brand_id, currentStart, currentEnd),
      brandPerformanceFor(brand_id, previousStart, previousEnd),
      productModel.countDocuments({ brand_id }),
    ]);

    const performance: BrandPerformance = {
      revenue: toMetric(
        currentPerf.revenue,
        currentPerf.revenue,
        previousPerf.revenue,
      ),
      total_product: totalProduct,
      products_sold: toMetric(
        currentPerf.productsSold,
        currentPerf.productsSold,
        previousPerf.productsSold,
      ),
    };

    return { ...brand, performance };
  } catch (error) {
    return {
      status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message:
        error instanceof Error
          ? error.message
          : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
    };
  }
};

const revenueFor = async (start: Date, end: Date) => {
  const [result] = await OrderModel.aggregate([
    {
      $match: {
        is_deleted: false,
        status: { $nin: ["CANCELLED", "RETURNED"] },
        createdAt: { $gte: start, $lt: end },
      },
    },
    { $unwind: "$products" },
    {
      $lookup: {
        from: productModel.collection.name,
        localField: "products.product_id",
        foreignField: "product_id",
        as: "productDoc",
      },
    },
    { $unwind: { path: "$productDoc", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: BrandModel.collection.name,
        localField: "productDoc.brand_id",
        foreignField: "brand_id",
        as: "brandDoc",
      },
    },
    { $unwind: { path: "$brandDoc", preserveNullAndEmptyArrays: true } },
    {
      $facet: {
        byBrand: [
          { $match: { "brandDoc.brand_id": { $exists: true } } },
          {
            $group: {
              _id: "$brandDoc.brand_id",
              total: { $sum: "$products.line_total" },
            },
          },
        ],
        byType: [
          { $match: { "brandDoc.brand_type": { $exists: true } } },
          {
            $group: {
              _id: "$brandDoc.brand_type",
              total: { $sum: "$products.line_total" },
            },
          },
        ],
        overall: [
          { $group: { _id: null, total: { $sum: "$products.line_total" } } },
        ],
      },
    },
  ]);

  return {
    byBrand: new Map<string, number>(
      (result?.byBrand ?? []).map((r: any) => [r._id, r.total]),
    ),
    byType: new Map<string, number>(
      (result?.byType ?? []).map((r: any) => [r._id, r.total]),
    ),
    overall: result?.overall?.[0]?.total ?? 0,
  };
};

const listBrands = async ({
  page,
  limit,
  skip,
  query,
  range,
  brand_type,
  status,
}: PaginationParams & {
  query?: string;
  brand_type?: string;
  status?: string;
} & RangeQuery) => {
  try {
    const filter: Record<string, unknown> = { is_deleted: false };

    if (query) {
      filter.$or = [
        { brand_name: { $regex: `^${query}`, $options: "i" } },
        { brand_search_tag: { $regex: `^${query}`, $options: "i" } },
      ];
    }

    if (brand_type) {
      filter.brand_type = { $regex: brand_type, $options: "i" };
    }

    if (status) {
      filter.status = { $regex: status, $options: "i" };
    }

    const { currentStart, currentEnd, previousStart, previousEnd } =
      resolveWindows({
        range,
      });

    const [
      items,
      total,
      currentRevenue,
      previousRevenue,
      productCounts,
      statusCounts,
    ] = await Promise.all([
      BrandModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BrandModel.countDocuments(filter),
      revenueFor(currentStart, currentEnd),
      revenueFor(previousStart, previousEnd),
      productModel.aggregate([
        { $group: { _id: "$brand_id", count: { $sum: 1 } } },
      ]),
      BrandModel.aggregate([
        { $match: { is_deleted: false } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const productCountByBrand = new Map<string, number>(
      productCounts.map((c: any) => [c._id, c.count]),
    );
    const countByStatus = new Map<string, number>(
      statusCounts.map((c: any) => [c._id, c.count]),
    );

    const listItems: BrandListItem[] = items.map((brand) => ({
      brand_id: brand.brand_id,
      brand_name: brand.brand_name,
      brand_affiliate_link: brand.brand_affiliate_link ?? null,
      brand_type: brand.brand_type,
      status: brand.status,
      total_product: productCountByBrand.get(brand.brand_id) ?? 0,
      total_revenue: currentRevenue.byBrand.get(brand.brand_id) ?? 0,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    }));

    const affiliateCurrent = currentRevenue.byType.get("affiliate") ?? 0;
    const affiliatePrevious = previousRevenue.byType.get("affiliate") ?? 0;
    const onboardedCurrent = currentRevenue.byType.get("onboarding") ?? 0;
    const onboardedPrevious = previousRevenue.byType.get("onboarding") ?? 0;

    const summary: BrandListSummary = {
      totalBrand: total,
      total_brand_live: countByStatus.get("Live") ?? 0,
      total_brand_hidden: countByStatus.get("Hidden") ?? 0,
      total_brand_draft: countByStatus.get("Draft") ?? 0,
      total_revenue: toMetric(
        currentRevenue.overall,
        currentRevenue.overall,
        previousRevenue.overall,
      ),
      affiliate_revenue: toMetric(
        affiliateCurrent,
        affiliateCurrent,
        affiliatePrevious,
      ),
      onboarded_revenue: toMetric(
        onboardedCurrent,
        onboardedCurrent,
        onboardedPrevious,
      ),
    };

    return {
      ...buildPaginatedResult(listItems, total, page, limit),
      summary,
    };
  } catch (error) {
    return {
      status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
      message:
        error instanceof Error
          ? error.message
          : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
    };
  }
};

export const brandService = {
  createBrand,
  updateBrand,
  deleteBrand,
  hardDeleteBrands,
  updateBrandsStatus,
  readBrand,
  listBrands,
};
