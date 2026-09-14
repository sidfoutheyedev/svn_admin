import { CONSTANT } from "../../packages/constants";
import {
  resolveWindows,
  toMetric,
  percentChange,
  formatGrowth,
} from "../../packages/utils";
import type { StatMetric } from "../../packages/utils";
import { productModel } from "../models/product.model";
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

export const analyticsService = {
  getStatsOverview,
  getRevenueOverview,
};
