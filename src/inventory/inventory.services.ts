import type { PipelineStage } from "mongoose";
import { CONSTANT } from "../../packages/constants";
import {
  buildPaginatedResult,
  formatGrowth,
  percentChange,
  resolveWindows,
} from "../../packages/utils";
import type { PaginationParams, RangeQuery } from "../../packages/utils";
import { inventoryModel } from "../models/inventory.model";
import { productModel } from "../models/product.model";
import { productVariantModel } from "../models/product_varient.model";
import { CategoryModel } from "../models/category.model";
import { OrderModel } from "../models/order.model";
import type {
  InventoryListSummary,
  InventoryTopSoldProduct,
  MovementType,
  RecordMovementRequest,
} from "./inventory.type";

export class InventoryError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const DUPLICATE_KEY_ERROR_CODE = 11000;

const toServiceError = (error: unknown) => {
  if (error instanceof InventoryError) {
    return { status: error.status, message: error.message };
  }
  return {
    status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message:
      error instanceof Error
        ? error.message
        : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
  };
};

const signedQuantity = (type: MovementType, quantity: number) =>
  type === "INBOUND" ? quantity : -quantity;


const applyMovement = async (
  type: MovementType,
  input: RecordMovementRequest,
) => {
  if (input.quantity <= 0) {
    throw new InventoryError(
      CONSTANT.HTTP_STATUS.BAD_REQUEST,
      "quantity must be a positive number",
    );
  }

  const variant = await productVariantModel.findOne({
    product_variant_id: input.product_variant_id,
    is_active: true,
  });
  if (!variant) {
    throw new InventoryError(
      CONSTANT.HTTP_STATUS.NOT_FOUND,
      "Product variant not found",
    );
  }

  const product = await productModel.findOne({
    product_id: variant.product_id,
  });
  if (
    !product ||
    !product.inventory_managed ||
    product.product_type === "AFFILIATE"
  ) {
    throw new InventoryError(
      CONSTANT.HTTP_STATUS.BAD_REQUEST,
      "This product is not inventory managed and cannot have stock movements",
    );
  }

  const delta = signedQuantity(type, input.quantity);
  const guard: Record<string, unknown> = {
    product_variant_id: input.product_variant_id,
    is_active: true,
  };
  if (delta < 0) {
    guard.stock_on_hand = { $gte: -delta };
  }

  const updated = await productVariantModel.findOneAndUpdate(
    guard,
    { $inc: { stock_on_hand: delta } },
    { new: true },
  );
  if (!updated) {
    throw new InventoryError(
      CONSTANT.HTTP_STATUS.CONFLICT,
      "Insufficient stock for this operation",
    );
  }

  try {
    const [movement] = await inventoryModel.create([
      {
        product_variant_id: input.product_variant_id,
        type,
        reason: input.reason,
        quantity: input.quantity,
        reference_id: input.reference_id ?? null,
        reference_type: input.reference_type ?? null,
        balance_after: updated.stock_on_hand,
        idempotency_key: input.idempotency_key,
        performed_by: input.performed_by ?? null,
        note: input.note ?? null,
      },
    ]);
    return movement;
  } catch (error: any) {

    await productVariantModel.updateOne(
      { product_variant_id: input.product_variant_id },
      { $inc: { stock_on_hand: -delta } },
    );
    if (error?.code === DUPLICATE_KEY_ERROR_CODE) {
      throw new InventoryError(
        CONSTANT.HTTP_STATUS.CONFLICT,
        "DUPLICATE_IDEMPOTENCY_KEY",
      );
    }
    throw error;
  }
};

// Product created/restocked, or a refund hands stock back — stock in.
const recordInbound = (input: RecordMovementRequest) =>
  applyMovement("INBOUND", input);

// An order/purchase goes through, or stock is written off — stock out.
const recordOutbound = (input: RecordMovementRequest) =>
  applyMovement("OUTBOUND", input);

const getVariantStock = async (product_variant_id: string) => {
  try {
    const variant = await productVariantModel.findOne(
      { product_variant_id, is_active: true },
      { stock_on_hand: 1, product_variant_id: 1 },
    );
    if (!variant) {
      return {
        status: CONSTANT.HTTP_STATUS.NOT_FOUND,
        message: CONSTANT.STATUS.NOT_FOUND,
      };
    }
    return {
      product_variant_id: variant.product_variant_id,
      stock_on_hand: variant.stock_on_hand,
    };
  } catch (error) {
    return toServiceError(error);
  }
};

const listMovements = async (
  product_variant_id: string,
  { page, limit, skip }: PaginationParams,
) => {
  try {
    const variant = await productVariantModel
      .findOne(
        { product_variant_id },
        { product_variant_id: 1, product_id: 1, stock_on_hand: 1, _id: 0 },
      )
      .lean();
    if (!variant) {
      return {
        status: CONSTANT.HTTP_STATUS.NOT_FOUND,
        message: CONSTANT.STATUS.NOT_FOUND,
      };
    }

    const filter = { product_variant_id };
    const [items, total] = await Promise.all([
      inventoryModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      inventoryModel.countDocuments(filter),
    ]);

    return {
      product_variant_id: variant.product_variant_id,
      product_id: variant.product_id,
      stock_on_hand: variant.stock_on_hand,
      movements: buildPaginatedResult(items, total, page, limit),
    };
  } catch (error) {
    return toServiceError(error);
  }
};

// Units sold across all products within a window — grouped by product_id so
// the highest seller can be picked with $sort/$limit.
const topSoldProductFor = async (start: Date, end: Date) => {
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
      $group: {
        _id: "$products.product_id",
        quantity: { $sum: "$products.quantity" },
      },
    },
    { $sort: { quantity: -1 } },
    { $limit: 3 },
  ]);

  return result
    ? { product_id: result._id as string, quantity: result.quantity as number }
    : null;
};

// Units sold for one specific product within a window — used to compute the
// previous-window figure for the current window's top seller.
const soldQuantityForProduct = async (
  product_id: string,
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
    { $match: { "products.product_id": product_id } },
    { $group: { _id: null, quantity: { $sum: "$products.quantity" } } },
  ]);

  return result?.quantity ?? 0;
};

const listInventory = async (
  { page, limit, skip }: PaginationParams,
  filters: { query?: string; status?: string } = {},
  rangeQuery: RangeQuery = {},
) => {
  try {
    const basePipeline: PipelineStage[] = [
      { $match: { is_active: true } },
      {
        $lookup: {
          from: productModel.collection.name,
          localField: "product_id",
          foreignField: "product_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: CategoryModel.collection.name,
          localField: "product.category",
          foreignField: "category_id",
          as: "categoryInfo",
        },
      },
      { $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: CategoryModel.collection.name,
          localField: "product.sub_category",
          foreignField: "category_id",
          as: "subCategoryInfo",
        },
      },
      {
        $unwind: { path: "$subCategoryInfo", preserveNullAndEmptyArrays: true },
      },
    ];

    if (filters.query?.trim()) {
      const query = filters.query.trim();
      basePipeline.push({
        $match: {
          $or: [
            { "product.product_name": { $regex: query, $options: "i" } },
            { "product.product_id": { $regex: query, $options: "i" } },
            { "categoryInfo.category_name": { $regex: query, $options: "i" } },
            {
              "subCategoryInfo.category_name": {
                $regex: query,
                $options: "i",
              },
            },
          ],
        },
      });
    }

    if (filters.status?.trim()) {
      basePipeline.push({
        $match: {
          "product.status": {
            $regex: `^${filters.status.trim()}$`,
            $options: "i",
          },
        },
      });
    }

    const [items, totalResult] = await Promise.all([
      productVariantModel.aggregate([
        ...basePipeline,
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: inventoryModel.collection.name,
            let: { variantId: "$product_variant_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$product_variant_id", "$$variantId"] },
                      { $eq: ["$type", "OUTBOUND"] },
                      { $eq: ["$reason", "SALE"] },
                    ],
                  },
                },
              },
              { $group: { _id: null, total: { $sum: "$quantity" } } },
            ],
            as: "soldInfo",
          },
        },
        {
          $lookup: {
            from: OrderModel.collection.name,
            let: { variantId: "$product_variant_id" },
            pipeline: [
              { $unwind: "$products" },
              {
                $match: {
                  $expr: {
                    $eq: ["$products.product_variant_id", "$$variantId"],
                  },
                },
              },
              { $group: { _id: null, total: { $sum: "$products.line_total" } } },
            ],
            as: "revenueInfo",
          },
        },
        {
          $addFields: {
            sold_stock: {
              $ifNull: [{ $arrayElemAt: ["$soldInfo.total", 0] }, 0],
            },
            total_revenue: {
              $ifNull: [{ $arrayElemAt: ["$revenueInfo.total", 0] }, 0],
            },
          },
        },
        {
          $project: {
            _id: 0,
            product_variant_id: 1,
            variant_combination: 1,
            stock_on_hand: 1,
            category_name: "$categoryInfo.category_name",
            category_id: "$categoryInfo.category_id",
            sub_category_name: "$subCategoryInfo.category_name",
            sub_category_id: "$subCategoryInfo.category_id",
            total_revenue: 1,
            sold_stock: 1,
            total_stock: { $add: ["$stock_on_hand", "$sold_stock"] },
            product_id: "$product.product_id",
            product_name: "$product.product_name",
          },
        },
      ]),
      productVariantModel.aggregate([...basePipeline, { $count: "total" }]),
    ]);

    const total = totalResult[0]?.total ?? 0;

    const { currentStart, currentEnd, previousStart, previousEnd } =
      resolveWindows(rangeQuery);

    const [totalStockResult, topSold] = await Promise.all([
      productVariantModel.aggregate([
        { $match: { is_active: true } },
        { $group: { _id: null, total: { $sum: "$stock_on_hand" } } },
      ]),
      topSoldProductFor(currentStart, currentEnd),
    ]);

    const total_stock_count = totalStockResult[0]?.total ?? 0;

    const top_sold_product: InventoryTopSoldProduct[] = [];
    if (topSold) {
      const [productDoc, defaultVariant, previousQuantity] =
        await Promise.all([
          productModel
            .findOne(
              { product_id: topSold.product_id },
              { product_name: 1, _id: 0 },
            )
            .lean(),
          productVariantModel
            .findOne(
              { product_id: topSold.product_id, is_active: true },
              { product_images: 1, _id: 0 },
            )
            .sort({ is_default: -1 })
            .lean(),
          soldQuantityForProduct(
            topSold.product_id,
            previousStart,
            previousEnd,
          ),
        ]);

      top_sold_product.push({
        product_name: productDoc?.product_name ?? "",
        product_image: defaultVariant?.product_images?.[0] ?? null,
        growth_rate: formatGrowth(
          percentChange(topSold.quantity, previousQuantity),
        ),
      });
    }

    const summary: InventoryListSummary = {
      total_stock_count,
      top_sold_product,
    };

    return { ...buildPaginatedResult(items, total, page, limit), summary };
  } catch (error) {
    return toServiceError(error);
  }
};

export const inventoryService = {
  recordInbound,
  recordOutbound,
  getVariantStock,
  listMovements,
  listInventory,
};
