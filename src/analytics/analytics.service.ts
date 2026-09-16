import { CONSTANT } from "../../packages/constants";
import {
  resolveWindows,
  toMetric,
  percentChange,
  formatGrowth,
} from "../../packages/utils";
import type { StatMetric } from "../../packages/utils";
import { productModel } from "../models/product.model";
import { productVariantModel } from "../models/product_varient.model";
import { OrderModel } from "../models/order.model";
import { RefundModel } from "../models/refund.model";
import { UserModel } from "../models/user.model";
import { BrandModel } from "../models/brand.model";
import { CategoryModel } from "../models/category.model";
import { SwipeEventModel } from "../models/swipe_event.model";
import type {
  AnalyticsQuery,
  RevenueOverviewResponse,
  StatsOverviewResponse,
  TopPerformingProductsResponse,
} from "./analytics.type";

const toServiceError = (error: unknown) => ({
  status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
  message:
    error instanceof Error
      ? error.message
      : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
});

const snapshotMetric = async (
  model: {
    countDocuments: (filter: Record<string, unknown>) => Promise<number>;
  },
  windows: ReturnType<typeof resolveWindows>,
): Promise<StatMetric> => {
  const { currentStart, currentEnd, previousStart, previousEnd } = windows;
  const [value, newInCurrent, newInPrevious] = await Promise.all([
    model.countDocuments({ is_deleted: { $ne: true } }),
    model.countDocuments({
      is_deleted: { $ne: true },
      createdAt: { $gte: currentStart, $lt: currentEnd },
    }),
    model.countDocuments({
      is_deleted: { $ne: true },
      createdAt: { $gte: previousStart, $lt: previousEnd },
    }),
  ]);
  return toMetric(value, newInCurrent, newInPrevious);
};

// Orders is an order-volume metric: value counts every order placed within
// the window regardless of later cancellation/return.
const ordersMetric = async (
  windows: ReturnType<typeof resolveWindows>,
): Promise<StatMetric> => {
  const { currentStart, currentEnd, previousStart, previousEnd } = windows;
  const [value, previous] = await Promise.all([
    OrderModel.countDocuments({
      is_deleted: false,
      createdAt: { $gte: currentStart, $lt: currentEnd },
    }),
    OrderModel.countDocuments({
      is_deleted: false,
      createdAt: { $gte: previousStart, $lt: previousEnd },
    }),
  ]);
  return toMetric(value, value, previous);
};

const refundRateFor = async (start: Date, end: Date) => {
  const [refunds, orders] = await Promise.all([
    RefundModel.countDocuments({
      is_deleted: false,
      createdAt: { $gte: start, $lt: end },
    }),
    OrderModel.countDocuments({
      is_deleted: false,
      createdAt: { $gte: start, $lt: end },
    }),
  ]);
  return orders > 0 ? (refunds / orders) * 100 : 0;
};

const refundRateMetric = async (
  windows: ReturnType<typeof resolveWindows>,
): Promise<StatMetric> => {
  const { currentStart, currentEnd, previousStart, previousEnd } = windows;
  const [current, previous] = await Promise.all([
    refundRateFor(currentStart, currentEnd),
    refundRateFor(previousStart, previousEnd),
  ]);
  return {
    value: `${Math.round(current * 100) / 100}%`,
    growth: formatGrowth(percentChange(current, previous)),
  };
};

const savedProductsFor = async (start: Date, end: Date) => {
  const [result] = await SwipeEventModel.aggregate([
    { $match: { direction: "DOWN", createdAt: { $gte: start, $lt: end } } },
    {
      $lookup: {
        from: productModel.collection.name,
        localField: "product_id",
        foreignField: "product_id",
        as: "productDoc",
      },
    },
    { $unwind: { path: "$productDoc", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: CategoryModel.collection.name,
        localField: "productDoc.category",
        foreignField: "category_id",
        as: "categoryDoc",
      },
    },
    { $unwind: { path: "$categoryDoc", preserveNullAndEmptyArrays: true } },
    {
      $facet: {
        byCategory: [
          {
            $group: {
              _id: "$categoryDoc.category_id",
              category_name: {
                $first: { $ifNull: ["$categoryDoc.category_name", "Others"] },
              },
              count: { $sum: 1 },
            },
          },
        ],
        total: [{ $count: "count" }],
      },
    },
  ]);

  const total: number = result?.total?.[0]?.count ?? 0;
  const byCategory = (result?.byCategory ?? [])
    .map((c: any) => ({
      category_id: c._id ?? "uncategorized",
      category_name: c.category_name,
      count: c.count,
      percentage: total > 0 ? Math.round((c.count / total) * 10000) / 100 : 0,
    }))
    .sort((a: { count: number }, b: { count: number }) => b.count - a.count);

  return { total, byCategory };
};

const getStatsOverview = async (
  query: AnalyticsQuery,
): Promise<StatsOverviewResponse | ReturnType<typeof toServiceError>> => {
  try {
    const windows = resolveWindows(query);
    const [
      products,
      orders,
      refund_rate,
      total_users,
      brands,
      savedCurrent,
      savedPrevious,
    ] = await Promise.all([
      snapshotMetric(productModel, windows),
      ordersMetric(windows),
      refundRateMetric(windows),
      snapshotMetric(UserModel, windows),
      snapshotMetric(BrandModel, windows),
      savedProductsFor(windows.currentStart, windows.currentEnd),
      savedProductsFor(windows.previousStart, windows.previousEnd),
    ]);

    return {
      products,
      orders,
      refund_rate,
      total_users,
      brands,
      saved_products: toMetric(
        savedCurrent.total,
        savedCurrent.total,
        savedPrevious.total,
      ),
      saved_by_category: savedCurrent.byCategory,
    };
  } catch (error) {
    return toServiceError(error);
  }
};

const revenueFor = async (
  start: Date,
  end: Date,
  onlyInventoryManaged?: boolean,
) => {
  const pipeline: any[] = [
    {
      $match: {
        is_deleted: false,
        status: { $nin: ["CANCELLED", "RETURNED"] },
        createdAt: { $gte: start, $lt: end },
      },
    },
    { $unwind: "$products" },
    ...(onlyInventoryManaged !== undefined
      ? [{ $match: { "products.inventory_managed": onlyInventoryManaged } }]
      : []),
    { $group: { _id: null, total: { $sum: "$products.line_total" } } },
  ];
  const result = await OrderModel.aggregate(pipeline);
  return result[0]?.total ?? 0;
};

const getRevenueOverview = async (
  query: AnalyticsQuery,
): Promise<RevenueOverviewResponse | ReturnType<typeof toServiceError>> => {
  try {
    const { currentStart, currentEnd, previousStart, previousEnd } =
      resolveWindows(query);
    const [totalCurrent, totalPrevious, onboardedCurrent, onboardedPrevious] =
      await Promise.all([
        revenueFor(currentStart, currentEnd),
        revenueFor(previousStart, previousEnd),
        revenueFor(currentStart, currentEnd, true),
        revenueFor(previousStart, previousEnd, true),
      ]);

    return {
      total_revenue: toMetric(totalCurrent, totalCurrent, totalPrevious),
      onboarded_revenue: toMetric(
        onboardedCurrent,
        onboardedCurrent,
        onboardedPrevious,
      ),
    };
  } catch (error) {
    return toServiceError(error);
  }
};

const TOP_PERFORMERS_LIMIT = 10;

const leftSwipeCountsFor = async (
  start: Date,
  end: Date,
  productIds: string[],
) => {
  const rows = await SwipeEventModel.aggregate([
    {
      $match: {
        direction: "LEFT",
        product_id: { $in: productIds },
        createdAt: { $gte: start, $lt: end },
      },
    },
    { $group: { _id: "$product_id", count: { $sum: 1 } } },
  ]);
  return new Map<string, number>(rows.map((r) => [r._id, r.count]));
};


const getperfromingproduct = async (
  query: AnalyticsQuery,
): Promise<TopPerformingProductsResponse | ReturnType<typeof toServiceError>> => {
  try {
    const { currentStart, currentEnd, previousStart, previousEnd } =
      resolveWindows(query);

    const ranked = await SwipeEventModel.aggregate([
      {
        $match: {
          direction: "LEFT",
          createdAt: { $gte: currentStart, $lt: currentEnd },
        },
      },
      { $group: { _id: "$product_id", left_swipe_count: { $sum: 1 } } },
      { $sort: { left_swipe_count: -1 } },
      { $limit: TOP_PERFORMERS_LIMIT },
      {
        $lookup: {
          from: productModel.collection.name,
          localField: "_id",
          foreignField: "product_id",
          as: "productDoc",
        },
      },
      { $unwind: "$productDoc" },
      {
        $lookup: {
          from: productVariantModel.collection.name,
          let: { productId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$product_id", "$$productId"] },
                is_active: true,
              },
            },
            { $sort: { is_default: -1 } },
            { $limit: 1 },
          ],
          as: "variantDoc",
        },
      },
      { $unwind: { path: "$variantDoc", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: CategoryModel.collection.name,
          localField: "productDoc.category",
          foreignField: "category_id",
          as: "categoryDoc",
        },
      },
      { $unwind: { path: "$categoryDoc", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: CategoryModel.collection.name,
          localField: "productDoc.sub_category",
          foreignField: "category_id",
          as: "subCategoryDoc",
        },
      },
      {
        $unwind: { path: "$subCategoryDoc", preserveNullAndEmptyArrays: true },
      },
      {
        $project: {
          _id: 0,
          product_id: "$_id",
          product_name: "$productDoc.product_name",
          product_image: { $arrayElemAt: ["$variantDoc.product_images", 0] },
          category_id: { $ifNull: ["$categoryDoc.category_id", null] },
          category_name: { $ifNull: ["$categoryDoc.category_name", null] },
          sub_category_id: { $ifNull: ["$subCategoryDoc.category_id", null] },
          sub_category_name: {
            $ifNull: ["$subCategoryDoc.category_name", null],
          },
          left_swipe_count: 1,
        },
      },
    ]);

    if (!ranked.length) return [];

    const previousCounts = await leftSwipeCountsFor(
      previousStart,
      previousEnd,
      ranked.map((product) => product.product_id),
    );

    return ranked.map((product) => ({
      product_id: product.product_id,
      product_name: product.product_name,
      product_image: product.product_image ?? null,
      category_id: product.category_id,
      category_name: product.category_name,
      sub_category_id: product.sub_category_id,
      sub_category_name: product.sub_category_name,
      left_swipe_count: product.left_swipe_count,
      growth_rate: formatGrowth(
        percentChange(
          product.left_swipe_count,
          previousCounts.get(product.product_id) ?? 0,
        ),
      ),
    }));
  } catch (error) {
    return toServiceError(error);
  }
};


export const analyticsService = {
  getStatsOverview,
  getRevenueOverview,
  getperfromingproduct
};
