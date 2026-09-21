import { randomBytes } from "crypto";
import { CONSTANT } from "../../packages/constants";
import {
  buildPaginatedResult,
  resolveWindows,
  toMetric,
} from "../../packages/utils";
import type { PaginationParams, RangeQuery } from "../../packages/utils";
import { isServiceError } from "../../packages/utils";
import { productModel } from "../models/product.model";
import { productVariantModel } from "../models/product_varient.model";
import { SKUModel } from "../models/product_sku.model";
import { VarientModel } from "../models/varient.model";
import { SwipeEventModel } from "../models/swipe_event.model";
import {
  inventoryService,
  InventoryError,
} from "../inventory/inventory.services";
import { parseProductsCsv } from "./product.csv";
import type { CsvRowError } from "./product.csv";
import type {
  ProductCreateRequest,
  ProductUpdateRequest,
  ProductVariantInput,
  ProductVariantUpdateRequest,
  ProductVariantResponse,
  ProductStatus,
  ProductListSummary,
} from "./product.type";

const generateId = () => randomBytes(6).toString("hex");

const toServiceError = (error: unknown) => ({
  status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
  message:
    error instanceof Error
      ? error.message
      : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
});

const validateVarientIds = async (varient_ids: string[] | undefined) => {
  if (!varient_ids?.length) return null;

  const found = await VarientModel.find(
    { varient_id: { $in: varient_ids }, is_deleted: false },
    { varient_id: 1 },
  ).lean();
  const foundIds = new Set(found.map((v) => v.varient_id));
  const missing = varient_ids.filter((id) => !foundIds.has(id));

  if (missing.length) {
    return {
      status: CONSTANT.HTTP_STATUS.BAD_REQUEST,
      message: `Unknown varient_ids: ${missing.join(", ")}`,
    };
  }
  return null;
};

const validateSkuCodes = async (allSkuCodes: string[]) => {
  if (!allSkuCodes.length) return null;

  const seen = new Set<string>();
  const duplicatesInPayload = new Set<string>();
  for (const code of allSkuCodes) {
    if (seen.has(code)) duplicatesInPayload.add(code);
    seen.add(code);
  }
  if (duplicatesInPayload.size) {
    return {
      status: CONSTANT.HTTP_STATUS.BAD_REQUEST,
      message: `Duplicate sku codes in payload: ${[...duplicatesInPayload].join(", ")}`,
    };
  }

  const existing = await SKUModel.find(
    { sku_code: { $in: allSkuCodes } },
    { sku_code: 1, _id: 0 },
  ).lean();
  if (existing.length) {
    return {
      status: CONSTANT.HTTP_STATUS.CONFLICT,
      message: `sku codes already exist: ${existing.map((s) => s.sku_code).join(", ")}`,
    };
  }
  return null;
};

const createProduct = async (payload: ProductCreateRequest) => {
  if (!payload.variants?.length) {
    return {
      status: CONSTANT.HTTP_STATUS.BAD_REQUEST,
      message: "A product must have at least one variant",
    };
  }
  const resolvedProductType =
    payload.product_type ?? (payload.affiliate_link ? "AFFILIATE" : "PHYSICAL");
  const isAffiliate = resolvedProductType === "AFFILIATE";
  if (isAffiliate && !payload.affiliate_link) {
    return {
      status: CONSTANT.HTTP_STATUS.BAD_REQUEST,
      message: "affiliate_link is required for AFFILIATE products",
    };
  }

  const varientIdError = await validateVarientIds(payload.varient_ids);
  if (varientIdError) return varientIdError;

  const allSkuCodes = payload.variants.flatMap((v) => v.sku ?? []);
  const skuError = await validateSkuCodes(allSkuCodes);
  if (skuError) return skuError;

  try {
    const product_id = generateId();
    const [createdProduct] = await productModel.create([
      {
        product_id,
        product_name: payload.product_name,
        brand_id: payload.brand_id,
        category: payload.category,
        sub_category: payload.sub_category,
        GST: payload.GST ?? null,
        product_style: payload.style,
        product_description: payload.product_description,
        product_type: resolvedProductType,
        gender: payload.gender,
        inventory_managed: !isAffiliate,
        affiliate_link: isAffiliate ? payload.affiliate_link : null,
        tag: payload.tag ?? [],
        search_tag: payload.search_tag ?? [],
        varient_ids: payload.varient_ids ?? [],
        status: payload.status ?? "Live",
      },
    ]);

    const createdVariants: ProductVariantResponse[] = [];
    const hasExplicitDefault = payload.variants.some((v) => v.is_default);

    for (const [index, variantInput] of payload.variants.entries()) {
      const product_variant_id = generateId();
      const skuCodes = isAffiliate ? [] : (variantInput.sku ?? []);

      const [variant] = await productVariantModel.create([
        {
          product_variant_id,
          product_id,
          variant_combination: variantInput.variant_combination ?? [],
          price: variantInput.price,
          discount_price: variantInput.discount_price ?? null,
          stock_on_hand: 0,
          product_images: variantInput.product_images ?? [],
          is_default:
            variantInput.is_default ?? (!hasExplicitDefault && index === 0),
        },
      ]);

      if (skuCodes.length) {
        await SKUModel.create(
          skuCodes.map((sku_code) => ({
            sku_unit_id: generateId(),
            product_id,
            product_varient_id: product_variant_id,
            sku_code,
            is_sold: false,
          })),
        );

        await inventoryService.recordInbound({
          product_variant_id,
          reason: "STOCKS ADJUSTED",
          quantity: skuCodes.length,
          reference_id: product_id,
          reference_type: "MANUAL",
          idempotency_key: `${product_variant_id}:OPENING_STOCK`,
          note: "Opening stock recorded at product creation",
        });
        variant.stock_on_hand = skuCodes.length;
      }

      const variantObject = variant.toObject();
      createdVariants.push({
        ...variantObject,
        discount_price: variantObject.discount_price ?? null,
        sku: skuCodes,
      });
    }

    const { product_style, ...productFields } = createdProduct.toObject();
    return {
      ...productFields,
      style: product_style,
      variants: createdVariants,
    };
  } catch (error: any) {
    if (error instanceof InventoryError) {
      return { status: error.status, message: error.message };
    }
    if (error?.code === 11000) {
      return {
        status: CONSTANT.HTTP_STATUS.CONFLICT,
        message: CONSTANT.PAYLOAD.RECORD_ALREADY_EXIST,
      };
    }
    return toServiceError(error);
  }
};

const bulkCreateProductsFromCsv = async (buffer: Buffer) => {
  const { products, errors } = parseProductsCsv(buffer);

  const created: unknown[] = [];
  const failed: { row: number | number[]; message: string }[] = errors.map(
    (e: CsvRowError) => ({
      row: e.row,
      message: e.message,
    }),
  );

  for (const { payload, rows } of products) {
    const result = await createProduct(payload);
    if (isServiceError(result)) {
      failed.push({
        row: rows,
        message: `${payload.product_name}: ${result.message}`,
      });
    } else {
      created.push(result);
    }
  }

  return {
    created_count: created.length,
    failed_count: failed.length,
    created,
    failed,
  };
};

const buildProductPipeline = (
  matchStage: Record<string, unknown>,
  opts: { sort?: Record<string, 1 | -1>; skip?: number; limit?: number } = {},
): any[] => [
  { $match: matchStage },
  ...(opts.sort ? [{ $sort: opts.sort }] : []),
  ...(opts.skip !== undefined ? [{ $skip: opts.skip }] : []),
  ...(opts.limit !== undefined ? [{ $limit: opts.limit }] : []),
  {
    $lookup: {
      from: "brands",
      localField: "brand_id",
      foreignField: "brand_id",
      as: "brand",
    },
  },
  { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: "categories",
      localField: "category",
      foreignField: "category_id",
      as: "category_doc",
    },
  },
  { $unwind: { path: "$category_doc", preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: "categories",
      localField: "sub_category",
      foreignField: "category_id",
      as: "sub_category_doc",
    },
  },
  { $unwind: { path: "$sub_category_doc", preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: "varients",
      localField: "varient_ids",
      foreignField: "varient_id",
      as: "varients",
    },
  },
  {
    $lookup: {
      from: "productswipestats",
      localField: "product_id",
      foreignField: "product_id",
      as: "swipe_stats",
    },
  },
  { $unwind: { path: "$swipe_stats", preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: "productvariants",
      let: { productId: "$product_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$product_id", "$$productId"] },
                { $eq: ["$is_active", true] },
              ],
            },
          },
        },
        {
          $lookup: {
            from: "sku_units",
            localField: "product_variant_id",
            foreignField: "product_varient_id",
            as: "sku_docs",
          },
        },
        { $addFields: { sku: "$sku_docs.sku_code" } },
      ],
      as: "variants",
    },
  },
  {
    $project: {
      _id: 0,
      product_id: 1,
      product_name: 1,
      product_description: 1,
      GST: 1,
      style: { $ifNull: ["$product_style", null] },
      product_type: 1,
      inventory_managed: 1,
      affiliate_link: 1,
      gender: 1,
      tag: 1,
      search_tag: 1,
      status: 1,
      createdAt: 1,
      updatedAt: 1,
      left_swipe_count: { $ifNull: ["$swipe_stats.left_swipe_count", 0] },
      right_swipe_count: { $ifNull: ["$swipe_stats.right_swipe_count", 0] },
      saves: { $ifNull: ["$swipe_stats.cart_add_count", 0] },
      brand: {
        $cond: [
          { $ifNull: ["$brand", false] },
          { brand_id: "$brand.brand_id", brand_name: "$brand.brand_name" },
          null,
        ],
      },
      category: {
        $cond: [
          { $ifNull: ["$category_doc", false] },
          {
            category_id: "$category_doc.category_id",
            category_name: "$category_doc.category_name",
          },
          null,
        ],
      },
      sub_category: {
        $cond: [
          { $ifNull: ["$sub_category_doc", false] },
          {
            category_id: "$sub_category_doc.category_id",
            category_name: "$sub_category_doc.category_name",
          },
          null,
        ],
      },
      selected_varients: {
        $map: {
          input: "$varients",
          as: "v",
          in: {
            varient_id: "$$v.varient_id",
            varient_name: "$$v.varient_name",
            varient_values: "$$v.varient_values",
          },
        },
      },
      product_varient: {
        $map: {
          input: "$variants",
          as: "variant",
          in: {
            product_variant_id: "$$variant.product_variant_id",
            variant_combination: "$$variant.variant_combination",
            price: "$$variant.price",
            discount_price: "$$variant.discount_price",
            stock_on_hand: "$$variant.stock_on_hand",
            product_images: "$$variant.product_images",
            is_default: "$$variant.is_default",
            is_active: "$$variant.is_active",
            sku: { $ifNull: ["$$variant.sku", []] },
          },
        },
      },
    },
  },
];

const resolveSelectedVarients = (products: any[]) =>
  products.map((product) => ({
    ...product,
    product_varient: (product.product_varient ?? []).map((variant: any) => ({
      ...variant,
      selected_varient: (variant.variant_combination ?? []).map(
        (value: string) => {
          for (const v of product.selected_varients ?? []) {
            if (v.varient_values?.includes(value)) {
              return { varient_name: v.varient_name, value };
            }
          }
          return { varient_name: "Unknown", value };
        },
      ),
    })),
  }));

const readProduct = async (product_id: string) => {
  try {
    const result = await productModel.aggregate(
      buildProductPipeline({ product_id, is_deleted: { $ne: true } }),
    );
    if (!result.length) {
      return {
        status: CONSTANT.HTTP_STATUS.NOT_FOUND,
        message: CONSTANT.STATUS.NOT_FOUND,
      };
    }
    return resolveSelectedVarients(result)[0];
  } catch (error) {
    return toServiceError(error);
  }
};

// LEFT/RIGHT ("like"/"dislike") and DOWN ("add to cart") swipe counts for
// one window, scoped to a set of product ids. One $group instead of three
// countDocuments calls.
const swipeCountsFor = async (
  start: Date,
  end: Date,
  product_id?: Record<string, unknown>,
) => {
  const match: Record<string, unknown> = {
    createdAt: { $gte: start, $lt: end },
    direction: { $in: ["LEFT", "RIGHT", "DOWN"] },
    ...(product_id ? { product_id } : {}),
  };
  const rows = await SwipeEventModel.aggregate([
    { $match: match },
    { $group: { _id: "$direction", count: { $sum: 1 } } },
  ]);
  const countByDirection = new Map<string, number>(
    rows.map((r: { _id: string; count: number }) => [r._id, r.count]),
  );
  return {
    left: countByDirection.get("LEFT") ?? 0,
    right: countByDirection.get("RIGHT") ?? 0,
    down: countByDirection.get("DOWN") ?? 0,
  };
};

const readAllproduct = async ({
  page,
  limit,
  skip,
  category_id,
  query,
  status,
  range,
  start_date,
  end_date,
}: PaginationParams &
  RangeQuery & {
    query?: string;
    status?: ProductStatus;
    category_id?: string;
  }) => {
  try {
   
    const searchMatchStage: Record<string, unknown> = {
      is_deleted: { $ne: true },
    };

    const filterConditions: Record<string, unknown>[] = [];
    if (query) {
      filterConditions.push({
        $or: [
          { product_name: { $regex: `^${query}`, $options: "i" } },
          { category: { $regex: `^${query}`, $options: "i" } },
          { sub_category: { $regex: `^${query}`, $options: "i" } },
        ],
      });
    }
    if (category_id) {
      filterConditions.push({
        $or: [{ category: category_id }, { sub_category: category_id }],
      });
    }
    if (filterConditions.length) {
      searchMatchStage.$and = filterConditions;
    }

    const matchStage: Record<string, unknown> = { ...searchMatchStage };
    if (status) {
      matchStage.status = status;
    }

    const { currentStart, currentEnd, previousStart, previousEnd } =
      resolveWindows({ range, start_date, end_date });

    const filteredProductIds =
      query || category_id
        ? await productModel.distinct("product_id", searchMatchStage)
        : undefined;
    const swipeProductFilter = filteredProductIds
      ? { $in: filteredProductIds }
      : undefined;

    const [items, total, current, previous, statusCounts] = await Promise.all([
      productModel.aggregate(
        buildProductPipeline(matchStage, {
          sort: { createdAt: -1 },
          skip,
          limit,
        }),
      ),
      productModel.countDocuments(matchStage),
      swipeCountsFor(currentStart, currentEnd, swipeProductFilter),
      swipeCountsFor(previousStart, previousEnd, swipeProductFilter),
      productModel.aggregate([
        { $match: searchMatchStage },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const countByStatus = new Map<string, number>(
      statusCounts.map((s: { _id: ProductStatus; count: number }) => [
        s._id,
        s.count,
      ]),
    );

    const summary: ProductListSummary = {
      left_swipes: toMetric(current.left, current.left, previous.left),
      right_swipes: toMetric(current.right, current.right, previous.right),
      saved_products: toMetric(current.down, current.down, previous.down),
      total_product_active: countByStatus.get("Live") ?? 0,
      total_product_hidden: countByStatus.get("Hidden") ?? 0,
      total_product_draft: countByStatus.get("Draft") ?? 0,
    };

    return {
      ...buildPaginatedResult(
        resolveSelectedVarients(items),
        total,
        page,
        limit,
      ),
      summary,
    };
  } catch (error) {
    return toServiceError(error);
  }
};

const updateProduct = async (
  product_id: string,
  payload: ProductUpdateRequest,
) => {
  try {
    const varientIdError = await validateVarientIds(payload.varient_ids);
    if (varientIdError) return varientIdError;

    // The request field is `style`; the stored path is `product_style`. Passing
    // `style` through untouched would be silently stripped by strict mode.
    const { style, ...fields } = payload;
    const product = await productModel.findOneAndUpdate(
      { product_id, is_deleted: { $ne: true } },
      style === undefined ? fields : { ...fields, product_style: style },
      {
        new: true,
        runValidators: true,
      },
    );
    if (!product) {
      return {
        status: CONSTANT.HTTP_STATUS.NOT_FOUND,
        message: CONSTANT.STATUS.NOT_FOUND,
      };
    }

    return readProduct(product_id);
  } catch (error) {
    return toServiceError(error);
  }
};

const hardDeleteProduct = async (ids: string[]) => {
  try {
    const variants = await productVariantModel
      .find({ product_id: { $in: ids } }, { product_variant_id: 1, _id: 0 })
      .lean();
    const variantIds = variants.map((v) => v.product_variant_id);

    const productResult = await productModel.deleteMany({
      product_id: { $in: ids },
    });
    await productVariantModel.deleteMany({ product_id: { $in: ids } });
    if (variantIds.length) {
      await SKUModel.deleteMany({ product_varient_id: { $in: variantIds } });
    }

    return { deleted: productResult.deletedCount };
  } catch (error) {
    return toServiceError(error);
  }
};

const updateManyProductStatus = async (
  ids: string[],
  status: ProductStatus,
) => {
  try {
    const result = await productModel.updateMany(
      { product_id: { $in: ids } },
      { status },
    );
    return { updated: result.modifiedCount };
  } catch (error) {
    return toServiceError(error);
  }
};

const createProductVarient = async (
  product_id: string,
  variantInput: ProductVariantInput,
) => {
  try {
    const product = await productModel.findOne({ product_id });
    if (!product) {
      return {
        status: CONSTANT.HTTP_STATUS.NOT_FOUND,
        message: CONSTANT.STATUS.NOT_FOUND,
      };
    }
    if (product.product_type === "AFFILIATE") {
      return {
        status: CONSTANT.HTTP_STATUS.BAD_REQUEST,
        message:
          "Affiliate products cannot have additional inventory-managed variants",
      };
    }

    const skuCodes = variantInput.sku ?? [];
    const skuError = await validateSkuCodes(skuCodes);
    if (skuError) return skuError;

    const product_variant_id = generateId();
    const [variant] = await productVariantModel.create([
      {
        product_variant_id,
        product_id,
        variant_combination: variantInput.variant_combination ?? [],
        price: variantInput.price,
        discount_price: variantInput.discount_price ?? null,
        stock_on_hand: 0,
        product_images: variantInput.product_images ?? [],
        is_default: variantInput.is_default ?? false,
      },
    ]);

    if (skuCodes.length) {
      await SKUModel.create(
        skuCodes.map((sku_code) => ({
          sku_unit_id: generateId(),
          product_id,
          product_varient_id: product_variant_id,
          sku_code,
          is_sold: false,
        })),
      );

      await inventoryService.recordInbound({
        product_variant_id,
        reason: "STOCKS ADJUSTED",
        quantity: skuCodes.length,
        reference_id: product_id,
        reference_type: "MANUAL",
        idempotency_key: `${product_variant_id}:OPENING_STOCK`,
        note: "Opening stock recorded when variant was added",
      });
      variant.stock_on_hand = skuCodes.length;
    }

    const variantObject = variant.toObject();
    return {
      ...variantObject,
      discount_price: variantObject.discount_price ?? null,
      sku: skuCodes,
    };
  } catch (error: any) {
    if (error instanceof InventoryError) {
      return { status: error.status, message: error.message };
    }
    if (error?.code === 11000) {
      return {
        status: CONSTANT.HTTP_STATUS.CONFLICT,
        message: CONSTANT.PAYLOAD.RECORD_ALREADY_EXIST,
      };
    }
    return toServiceError(error);
  }
};

const updateProductVarient = async (
  product_variant_id: string,
  payload: ProductVariantUpdateRequest,
) => {
  try {
    const variant = await productVariantModel.findOneAndUpdate(
      { product_variant_id, is_active: true },
      payload,
      {
        new: true,
        runValidators: true,
      },
    );
    if (!variant) {
      return {
        status: CONSTANT.HTTP_STATUS.NOT_FOUND,
        message: CONSTANT.STATUS.NOT_FOUND,
      };
    }
    return variant.toObject();
  } catch (error: any) {
    if (error?.code === 11000) {
      return {
        status: CONSTANT.HTTP_STATUS.CONFLICT,
        message: CONSTANT.PAYLOAD.RECORD_ALREADY_EXIST,
      };
    }
    return toServiceError(error);
  }
};

const hardDeleteProductVarient = async (product_variant_ids: string[]) => {
  try {
    const variants = await productVariantModel
      .find(
        { product_variant_id: { $in: product_variant_ids } },
        { product_variant_id: 1, product_id: 1, _id: 0 },
      )
      .lean();
    if (!variants.length) {
      return {
        status: CONSTANT.HTTP_STATUS.NOT_FOUND,
        message: CONSTANT.STATUS.NOT_FOUND,
      };
    }

    const affectedProductIds = [...new Set(variants.map((v) => v.product_id))];
    const totals = await productVariantModel.aggregate([
      { $match: { product_id: { $in: affectedProductIds } } },
      { $group: { _id: "$product_id", count: { $sum: 1 } } },
    ]);
    const totalByProduct = new Map(totals.map((r: any) => [r._id, r.count]));

    const deletingByProduct = new Map<string, number>();
    for (const v of variants) {
      deletingByProduct.set(
        v.product_id,
        (deletingByProduct.get(v.product_id) ?? 0) + 1,
      );
    }

    const wouldEmpty = affectedProductIds.filter(
      (id) => (deletingByProduct.get(id) ?? 0) >= (totalByProduct.get(id) ?? 0),
    );
    if (wouldEmpty.length) {
      return {
        status: CONSTANT.HTTP_STATUS.BAD_REQUEST,
        message: `Cannot delete every variant of a product — product(s) would have none left: ${wouldEmpty.join(", ")}`,
      };
    }

    const ids = variants.map((v) => v.product_variant_id);
    const result = await productVariantModel.deleteMany({
      product_variant_id: { $in: ids },
    });
    await SKUModel.deleteMany({ product_varient_id: { $in: ids } });

    return { deleted: result.deletedCount };
  } catch (error) {
    return toServiceError(error);
  }
};

const deleteProduct = async (ids: string[]) => {
  try {
    const variants = await productVariantModel
      .find({ product_id: { $in: ids } }, { product_variant_id: 1, _id: 0 })
      .lean();
    const variantIds = variants.map((v) => v.product_variant_id);

    const result = await productModel.updateMany(
      { product_id: { $in: ids }, is_deleted: { $ne: true } },
      { is_deleted: true },
    );
    await productVariantModel.updateMany(
      { product_id: { $in: ids } },
      { is_active: false },
    );
    if (variantIds.length) {
      await SKUModel.updateMany(
        { product_varient_id: { $in: variantIds } },
        { is_deleted: true },
      );
    }
    return { updated: result.modifiedCount };
  } catch (error) {
    return toServiceError(error);
  }
};

const deleteProductVarient = async (product_variant_ids: string[]) => {
  try {
    const variants = await productVariantModel
      .find(
        { product_variant_id: { $in: product_variant_ids }, is_active: true },
        { product_variant_id: 1, product_id: 1, _id: 0 },
      )
      .lean();
    if (!variants.length) {
      return {
        status: CONSTANT.HTTP_STATUS.NOT_FOUND,
        message: CONSTANT.STATUS.NOT_FOUND,
      };
    }

    const affectedProductIds = [...new Set(variants.map((v) => v.product_id))];
    const activeTotals = await productVariantModel.aggregate([
      { $match: { product_id: { $in: affectedProductIds }, is_active: true } },
      { $group: { _id: "$product_id", count: { $sum: 1 } } },
    ]);
    const activeByProduct = new Map(
      activeTotals.map((r: any) => [r._id, r.count]),
    );

    const deactivatingByProduct = new Map<string, number>();
    for (const v of variants) {
      deactivatingByProduct.set(
        v.product_id,
        (deactivatingByProduct.get(v.product_id) ?? 0) + 1,
      );
    }

    const wouldEmpty = affectedProductIds.filter(
      (id) =>
        (deactivatingByProduct.get(id) ?? 0) >= (activeByProduct.get(id) ?? 0),
    );
    if (wouldEmpty.length) {
      return {
        status: CONSTANT.HTTP_STATUS.BAD_REQUEST,
        message: `Cannot deactivate every active variant of a product — product(s) would have none left: ${wouldEmpty.join(", ")}`,
      };
    }

    const ids = variants.map((v) => v.product_variant_id);
    const result = await productVariantModel.updateMany(
      { product_variant_id: { $in: ids } },
      { is_active: false },
    );
    await SKUModel.updateMany(
      { product_varient_id: { $in: ids } },
      { is_deleted: true },
    );
    return { updated: result.modifiedCount };
  } catch (error) {
    return toServiceError(error);
  }
};

const getAllProductVarient = async ({
  page,
  limit,
  skip,
  query,
  product_id,
}: PaginationParams & { query?: string; product_id?: string }) => {
  try {
    const matchStage: Record<string, unknown> = { is_active: true };
    if (product_id) {
      matchStage.product_id = product_id;
    }

    const basePipeline: any[] = [
      { $match: matchStage },
      {
        $lookup: {
          from: "products",
          localField: "product_id",
          foreignField: "product_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      { $match: { "product.is_deleted": { $ne: true } } },
    ];

    if (query) {
      basePipeline.push({
        $match: {
          "product.product_name": { $regex: `^${query}`, $options: "i" },
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
            from: "sku_units",
            localField: "product_variant_id",
            foreignField: "product_varient_id",
            as: "sku_docs",
          },
        },
        {
          $project: {
            _id: 0,
            product_variant_id: 1,
            product_id: 1,
            product_name: "$product.product_name",
            variant_combination: 1,
            price: 1,
            discount_price: 1,
            stock_on_hand: 1,
            product_images: 1,
            is_default: 1,
            is_active: 1,
            sku: {
              $map: {
                input: "$sku_docs",
                as: "sku",
                in: {
                  sku_code: "$$sku.sku_code",
                  is_sold: "$$sku.is_sold",
                },
              },
            },
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ]),
      productVariantModel.aggregate([...basePipeline, { $count: "total" }]),
    ]);

    const total = totalResult[0]?.total ?? 0;
    return buildPaginatedResult(items, total, page, limit);
  } catch (error) {
    return toServiceError(error);
  }
};

const ProductServices = {
  createProduct,
  updateProduct,
  readProduct,
  readAllproduct,
  deleteProduct,
  hardDeleteProduct,
  updateManyProductStatus,
  createProductVarient,
  updateProductVarient,
  deleteProductVarient,
  hardDeleteProductVarient,
  getAllProductVarient,
  bulkCreateProductsFromCsv,
};

export default ProductServices;
