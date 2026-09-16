import { randomBytes } from "crypto";
import type { PipelineStage } from "mongoose";
import { CONSTANT } from "../../packages/constants";
import { buildPaginatedResult, isServiceError, resolveWindows, percentChange, formatGrowth } from "../../packages/utils";
import type { PaginationParams, RangeQuery } from "../../packages/utils";
import { RefundModel } from "../models/refund.model";
import { OrderModel } from "../models/order.model";
import { ShipmentModel } from "../models/shipment.model";
import { PaymentModel } from "../models/payment.model";
import { UserProfileModel } from "../models/profile.model";
import { orderService } from "../order/order.services";
import type { OrderLineItemData } from "../order/order.type";
import type { RefundCreateRequest, RefundListSummary, RefundStatus } from "./refund.type";

const generateId = () => randomBytes(6).toString("hex");

const toServiceError = (error: unknown) => ({
  status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
  message:
    error instanceof Error
      ? error.message
      : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
});

const createRefund = async (payload: RefundCreateRequest) => {
  try {
    const order = await OrderModel.findOne({
      order_id: payload.order_id,
      user_id: payload.user_id,
      is_deleted: false,
    });
    if (!order) {
      return {
        status: CONSTANT.HTTP_STATUS.BAD_REQUEST,
        message: "Order not found for this user",
      };
    }

    if (payload.shipment_id) {
      const shipment = await ShipmentModel.findOne({
        shipment_id: payload.shipment_id,
        order_id: payload.order_id,
        is_deleted: false,
      });
      if (!shipment) {
        return {
          status: CONSTANT.HTTP_STATUS.BAD_REQUEST,
          message: "Shipment not found for this order",
        };
      }
    }

    const refund = await RefundModel.create({
      refund_id: generateId(),
      user_id: payload.user_id,
      order_id: payload.order_id,
      shipment_id: payload.shipment_id ?? null,
      refund_status: "REQUESTED",
      refund_remark: payload.refund_remark ?? null,
    });

    return refund.toObject();
  } catch (error) {
    return toServiceError(error);
  }
};

const readRefund = async (refund_id: string) => {
  try {
    const refund = await RefundModel.findOne({
      refund_id,
      is_deleted: false,
    }).lean();
    if (!refund) {
      return {
        status: CONSTANT.HTTP_STATUS.NOT_FOUND,
        message: CONSTANT.STATUS.NOT_FOUND,
      };
    }
    return refund;
  } catch (error) {
    return toServiceError(error);
  }
};

const listRefunds = async ({
  page,
  limit,
  skip,
  search,
  status,
  range,
  start_date,
  end_date,
}: PaginationParams & {
  status?: RefundStatus;
  search?: string;
} & RangeQuery) => {
  try {
    const { currentStart, currentEnd, previousStart, previousEnd } = resolveWindows({
      range,
      start_date,
      end_date,
    });

    const matchStage: Record<string, unknown> = { is_deleted: false };

    const trimmedSearch = search?.trim();
    const searchStage: PipelineStage[] = trimmedSearch
      ? [
          {
            $match: {
              $or: [
                { refund_id: { $regex: trimmedSearch, $options: "i" } },
                { user_id: { $regex: trimmedSearch, $options: "i" } },
                {
                  "ProfileDetails.full_name": {
                    $regex: trimmedSearch,
                    $options: "i",
                  },
                },
                {
                  "OrderDetails.products.product_id": {
                    $regex: trimmedSearch,
                    $options: "i",
                  },
                },
                {
                  // products.sku is an array-of-arrays (each product line has its own sku
                  // array), so a plain dotted $regex can't reliably reach into it — walk it
                  // explicitly instead.
                  $expr: {
                    $anyElementTrue: {
                      $map: {
                        input: { $ifNull: ["$OrderDetails.products", []] },
                        as: "p",
                        in: {
                          $anyElementTrue: {
                            $map: {
                              input: { $ifNull: ["$$p.sku", []] },
                              as: "s",
                              in: {
                                $regexMatch: {
                                  input: "$$s",
                                  regex: trimmedSearch,
                                  options: "i",
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              ],
            },
          },
        ]
      : [];

    const [result] = await RefundModel.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: OrderModel.collection.name,
          localField: "order_id",
          foreignField: "order_id",
          as: "OrderDetails",
        },
      },
      { $unwind: { path: "$OrderDetails", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: UserProfileModel.collection.name,
          localField: "user_id",
          foreignField: "user_id",
          as: "ProfileDetails",
        },
      },
      {
        $unwind: { path: "$ProfileDetails", preserveNullAndEmptyArrays: true },
      },
      ...searchStage,
      { $sort: { createdAt: -1 } },
      {
        $addFields: {
          FirstProduct: { $arrayElemAt: ["$OrderDetails.products", 0] },
        },
      },
      {
        $facet: {
          items: [
            ...(status ? [{ $match: { refund_status: status } }] : []),
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 0,
                refund_id: 1,
                product_id: "$FirstProduct.product_id",
                item_code: { $arrayElemAt: ["$FirstProduct.sku", 0] },
                customer_name: "$ProfileDetails.full_name",
                customer_id: "$user_id",
                reason: "$refund_remark",
                order_date: "$OrderDetails.createdAt",
                refund_processing_date: "$updatedAt",
                status: "$refund_status",
              },
            },
          ],
          total: [
            ...(status ? [{ $match: { refund_status: status } }] : []),
            { $count: "count" },
          ],
          // "recent_*" counts + growth_value are windowed by createdAt and
          // deliberately ignore the `status` filter, matching the
          // summary-vs-status-tab pattern used elsewhere (Order, Brand, User).
          currentPeriodCounts: [
            { $match: { createdAt: { $gte: currentStart, $lt: currentEnd } } },
            { $group: { _id: "$refund_status", count: { $sum: 1 } } },
          ],
          previousPeriodCounts: [
            { $match: { createdAt: { $gte: previousStart, $lt: previousEnd } } },
            { $group: { _id: "$refund_status", count: { $sum: 1 } } },
          ],
        },
      },
    ]);

    const items = result?.items ?? [];
    const total: number = result?.total?.[0]?.count ?? 0;

    const toCountMap = (rows: { _id: string; count: number }[] | undefined) =>
      new Map<string, number>((rows ?? []).map((r) => [r._id, r.count]));

    const currentByStatus = toCountMap(result?.currentPeriodCounts);
    const previousByStatus = toCountMap(result?.previousPeriodCounts);

    const sumCounts = (byStatus: Map<string, number>) =>
      [...byStatus.values()].reduce((sum, count) => sum + count, 0);

    const growthFor = (refundStatus?: RefundStatus) => {
      const current = refundStatus ? currentByStatus.get(refundStatus) ?? 0 : sumCounts(currentByStatus);
      const previous = refundStatus ? previousByStatus.get(refundStatus) ?? 0 : sumCounts(previousByStatus);
      return formatGrowth(percentChange(current, previous));
    };

    const summary: RefundListSummary = [
      { recent_refund: sumCounts(currentByStatus), growth_value: growthFor() },
      { recent_completed: currentByStatus.get("PROCESSED") ?? 0, growth_value: growthFor("PROCESSED") },
      { recent_pending: currentByStatus.get("REQUESTED") ?? 0, growth_value: growthFor("REQUESTED") },
    ];

    return { ...buildPaginatedResult(items, total, page, limit), summary };
  } catch (error) {
    return toServiceError(error);
  }
};

const applyRefundStatus = async (refund_id: string, status: RefundStatus) => {
  const refund = await RefundModel.findOne({ refund_id, is_deleted: false });
  if (!refund) {
    return {
      status: CONSTANT.HTTP_STATUS.NOT_FOUND,
      message: CONSTANT.STATUS.NOT_FOUND,
    };
  }
  if (refund.refund_status === "PROCESSED") {
    return {
      status: CONSTANT.HTTP_STATUS.BAD_REQUEST,
      message: "Refund has already been processed",
    };
  }

  if (status !== "PROCESSED") {
    refund.refund_status = status;
    await refund.save();
    return refund.toObject();
  }

  try {
    const order = await OrderModel.findOne({ order_id: refund.order_id });
    if (!order) {
      return {
        status: CONSTANT.HTTP_STATUS.BAD_REQUEST,
        message: "Order not found",
      };
    }

    await orderService.restockOrderLines(
      {
        order_id: order.order_id,
        products: order.products as unknown as OrderLineItemData[],
      },
      `REFUND_${refund_id}_RESTOCK`,
    );
    await OrderModel.updateOne(
      { order_id: order.order_id },
      { status: "RETURNED" },
    );

    if (order.payment_id) {
      await PaymentModel.updateOne(
        { payment_id: order.payment_id },
        { status: "REFUNDED" },
      );
    }

    await RefundModel.updateOne({ refund_id }, { refund_status: "PROCESSED" });
    return { ...refund.toObject(), refund_status: "PROCESSED" };
  } catch (error) {
    return toServiceError(error);
  }
};

const updateRefundsStatus = async (ids: string[], status: RefundStatus) => {
  const results = await Promise.all(
    ids.map((refund_id) => applyRefundStatus(refund_id, status)),
  );
  const updated = results.filter((r) => !isServiceError(r)).length;
  return { updated, total: ids.length };
};

const deleteRefund = async (ids: string[]) => {
  try {
    if (ids.length === 0) {
      return {
        status: CONSTANT.HTTP_STATUS.BAD_REQUEST,
        message: "Refund IDs are required",
      };
    }

    const result = await RefundModel.updateMany(
      {
        refund_id: { $in: ids },
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

    return {
      deleted: result.modifiedCount,
    };
  } catch (error) {
    return toServiceError(error);
  }
};

const hardDeleteRefunds = async (ids: string[]) => {
  try {
    const result = await RefundModel.deleteMany({ refund_id: { $in: ids } });
    return { deleted: result.deletedCount };
  } catch (error) {
    return toServiceError(error);
  }
};

export const refundService = {
  createRefund,
  readRefund,
  listRefunds,
  updateRefundsStatus,
  deleteRefund,
  hardDeleteRefunds,
};
