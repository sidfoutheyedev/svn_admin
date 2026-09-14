import { randomBytes } from "crypto";
import type { PipelineStage } from "mongoose";
import { CONSTANT } from "../../packages/constants";
import { buildPaginatedResult, isServiceError, resolveWindows, percentChange } from "../../packages/utils";
import type { PaginationParams, RangeQuery } from "../../packages/utils";
import { OrderModel } from "../models/order.model";
import { AddressModel } from "../models/address.model";
import { PaymentModel } from "../models/payment.model";
import { productModel } from "../models/product.model";
import { productVariantModel } from "../models/product_varient.model";
import { SKUModel } from "../models/product_sku.model";
import { UserProfileModel } from "../models/profile.model";
import { UserModel } from "../models/user.model";
import { inventoryService, InventoryError } from "../inventory/inventory.services";
import { paymentService } from "../payment/payment.services";
import type { OrderCreateRequest, OrderLineItemData, OrderListSummary, OrderStatus, PaymentSummary } from "./order.type";

const generateId = () => randomBytes(6).toString("hex");
const generateOrderNumber = () => `ORD-${randomBytes(4).toString("hex").toUpperCase()}`;

class OrderError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const toServiceError = (error: unknown) => {
  if (error instanceof OrderError || error instanceof InventoryError) {
    return { status: error.status, message: error.message };
  }
  return {
    status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message: error instanceof Error ? error.message : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
  };
};

// Statuses an order can never leave — cancelling/refunding past this point
// belongs to a future Refund flow, not a plain status update.
const TERMINAL_STATUSES: OrderStatus[] = ["CANCELLED", "RETURNED"];

const toPaymentSummary = (payment: any): PaymentSummary | null =>
  payment
    ? {
      payment_id: payment.payment_id,
      order_id: payment.order_id,
      transaction_id: payment.transaction_id ?? null,
      payment_mode: payment.payment_mode,
      amount: payment.amount,
      status: payment.status,
    }
    : null;

const claimSkuUnits = async (product_variant_id: string, quantity: number): Promise<string[]> => {
  const units = await SKUModel.find({ product_varient_id: product_variant_id, is_sold: false })
    .limit(quantity)
    .lean();
  if (units.length < quantity) {
    throw new OrderError(
      CONSTANT.HTTP_STATUS.CONFLICT,
      `Not enough available sku units for variant ${product_variant_id} (need ${quantity}, have ${units.length})`
    );
  }
  await SKUModel.updateMany({ _id: { $in: units.map((u) => u._id) } }, { is_sold: true });
  return units.map((u) => u.sku_code);
};

const releaseSkuUnits = async (product_variant_id: string, sku_codes: string[]) => {
  if (!sku_codes.length) return;
  await SKUModel.updateMany({ product_varient_id: product_variant_id, sku_code: { $in: sku_codes } }, { is_sold: false });
};

const restockOrderLines = async (order: { order_id: string; products: OrderLineItemData[] }, idempotencySuffix: string) => {
  for (const line of order.products) {
    if (!line.inventory_managed) continue;
    await releaseSkuUnits(line.product_variant_id, line.sku);
    await inventoryService.recordInbound({
      product_variant_id: line.product_variant_id,
      reason: "CUSTOMER_RETURN",
      quantity: line.quantity,
      reference_id: order.order_id,
      reference_type: "ORDER",
      idempotency_key: `${order.order_id}:${line.product_variant_id}:${idempotencySuffix}`,
    });
  }
};


const createOrder = async (payload: OrderCreateRequest) => {
  const address = await AddressModel.findOne({
    address_id: payload.address_id,
    user_id: payload.user_id,
    is_deleted: false,
  });
  if (!address) {
    return { status: CONSTANT.HTTP_STATUS.BAD_REQUEST, message: "Address not found for this user" };
  }

  try {
    const order_id = generateId();
    const lines: OrderLineItemData[] = [];
    let quantity = 0;
    let subtotal = 0;
    let total_price = 0;
    let tax_total = 0;

    for (const item of payload.products) {
      const variant = await productVariantModel.findOne({
        product_variant_id: item.product_variant_id,
        is_active: true,
      });
      if (!variant) {
        return { status: CONSTANT.HTTP_STATUS.BAD_REQUEST, message: `Unknown product_variant_id: ${item.product_variant_id}` };
      }

      const product = await productModel.findOne({ product_id: variant.product_id, is_deleted: false });
      if (!product) {
        return { status: CONSTANT.HTTP_STATUS.BAD_REQUEST, message: `Product not found for variant: ${item.product_variant_id}` };
      }

      const inventory_managed = product.inventory_managed && product.product_type !== "AFFILIATE";
      const unitPrice = variant.price;
      const unitPayable = variant.discount_price ?? variant.price;
      const line_total = unitPayable * item.quantity;

      let sku: string[] = [];
      if (inventory_managed) {
        sku = await claimSkuUnits(variant.product_variant_id, item.quantity);
        try {
          await inventoryService.recordOutbound({
            product_variant_id: variant.product_variant_id,
            reason: "SALE",
            quantity: item.quantity,
            reference_id: order_id,
            reference_type: "ORDER",
            idempotency_key: `${order_id}:${variant.product_variant_id}:SALE`,
          });
        } catch (error) {
          await releaseSkuUnits(variant.product_variant_id, sku);
          throw error;
        }
      }

      lines.push({
        product_id: product.product_id,
        product_variant_id: variant.product_variant_id,
        sku,
        product_name: product.product_name,
        GST: product.GST ?? null,
        variant_combination: variant.variant_combination ?? [],
        quantity: item.quantity,
        price: unitPrice,
        discount_price: variant.discount_price ?? null,
        line_total,
        inventory_managed,
      });

      quantity += item.quantity;
      subtotal += unitPrice * item.quantity;
      total_price += line_total;
      tax_total += line_total * ((Number(product.GST) || 0) / 100);
    }

    const order = await OrderModel.create({
      order_id,
      order_number: generateOrderNumber(),
      user_id: payload.user_id,
      address_id: payload.address_id,
      products: lines,
      quantity,
      total_price,
      tax_total,
      discount_price: subtotal - total_price,
      status: "PENDING",
      payment_id: null,
    });

    let payment: PaymentSummary | null = null;
    if (payload.payment) {
      const paymentResult = await paymentService.createPayment({
        order_id,
        amount: total_price,
        payment_mode: payload.payment.payment_mode,
        transaction_id: payload.payment.transaction_id,
        status: payload.payment.status,
      });
      if (!isServiceError(paymentResult)) {
        payment = toPaymentSummary(paymentResult);
      }
    }

    const finalOrder = payment ? await OrderModel.findOne({ order_id }).lean() : order.toObject();
    return { ...finalOrder, payment };
  } catch (error) {
    return toServiceError(error);
  }
};

const readOrder = async (order_id: string) => {
  try {
    const order = await OrderModel.findOne({ order_id, is_deleted: false }).lean();
    if (!order) {
      return { status: CONSTANT.HTTP_STATUS.NOT_FOUND, message: CONSTANT.STATUS.NOT_FOUND };
    }
    const payment = order.payment_id ? await PaymentModel.findOne({ payment_id: order.payment_id }).lean() : null;
    return { ...order, payment: toPaymentSummary(payment) };
  } catch (error) {
    return toServiceError(error);
  }
};

const listOrders = async ({
  page,
  limit,
  skip,
  user_id,
  status,
  search,
  range,
  start_date,
  end_date,
}: PaginationParams & { user_id?: string; status?: OrderStatus; search?: string } & RangeQuery) => {
  try {
    const { currentStart, currentEnd, previousStart, previousEnd } = resolveWindows({
      range,
      start_date,
      end_date,
    });

    const matchStage: Record<string, unknown> = { is_deleted: false };
    if (user_id) matchStage.user_id = user_id;

    const searchStage: PipelineStage[] = search?.trim()
      ? [
          {
            $match: {
              $or: [
                { order_id: { $regex: search.trim(), $options: "i" } },
                { user_id: { $regex: search.trim(), $options: "i" } },
                {
                  "ProfileDetails.full_name": {
                    $regex: search.trim(),
                    $options: "i",
                  },
                },
                {
                  "PaymentDetails.transaction_id": {
                    $regex: search.trim(),
                    $options: "i",
                  },
                },
              ],
            },
          },
        ]
      : [];

    const [result] = await OrderModel.aggregate([
      { $match: matchStage },
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
      {
        $lookup: {
          from: UserModel.collection.name,
          localField: "user_id",
          foreignField: "user_id",
          as: "UserDetails",
        },
      },
      {
        $unwind: { path: "$UserDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $lookup: {
          from: PaymentModel.collection.name,
          localField: "order_id",
          foreignField: "order_id",
          as: "PaymentDetails",
        },
      },
      {
        $unwind: { path: "$PaymentDetails", preserveNullAndEmptyArrays: true },
      },
      ...searchStage,
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          items: [
            ...(status ? [{ $match: { status } }] : []),
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 0,
                order_id: 1,
                order_number: 1,
                user_id: 1,
                customer_name: "$ProfileDetails.full_name",
                customer_email: "$UserDetails.email",
                customer_phone: "$ProfileDetails.phone",
                address_id: 1,
                products: 1,
                total_product: { $size: "$products" },
                total_price: 1,
                tax_total: 1,
                discount_price: 1,
                status: 1,
                payment_id: 1,
                PaymentDetails: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
          total: [...(status ? [{ $match: { status } }] : []), { $count: "count" }],
        
          statusCounts: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
         
          currentPeriodCounts: [
            { $match: { createdAt: { $gte: currentStart, $lt: currentEnd } } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ],
          previousPeriodCounts: [
            { $match: { createdAt: { $gte: previousStart, $lt: previousEnd } } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ],
        },
      },
    ]);

    const rawItems: any[] = result?.items ?? [];
    const total: number = result?.total?.[0]?.count ?? 0;

    const toCountMap = (rows: { _id: string; count: number }[] | undefined) =>
      new Map<string, number>((rows ?? []).map((s) => [s._id, s.count]));

    const countByStatus = toCountMap(result?.statusCounts);
    const currentByStatus = toCountMap(result?.currentPeriodCounts);
    const previousByStatus = toCountMap(result?.previousPeriodCounts);

    const sumCounts = (byStatus: Map<string, number>) =>
      [...byStatus.values()].reduce((sum, count) => sum + count, 0);

    const growthFor = (status?: OrderStatus) => {
      const current = status ? currentByStatus.get(status) ?? 0 : sumCounts(currentByStatus);
      const previous = status ? previousByStatus.get(status) ?? 0 : sumCounts(previousByStatus);
      return percentChange(current, previous);
    };

    const summary: OrderListSummary = [
      { total_order: sumCounts(countByStatus), growth_rate: `${growthFor()} %`},
      { total_confirm_order: countByStatus.get("CONFIRMED") ?? 0, growth_rate: `${growthFor("CONFIRMED")} %` },
      { total_cancel_order: countByStatus.get("CANCELLED") ?? 0, growth_rate: `${growthFor("CANCELLED")} %` },
    ];

    const allSkuCodes = [
      ...new Set(
        rawItems.flatMap((order) =>
          (order.products ?? []).flatMap((line: OrderLineItemData) => line.sku ?? [])
        )
      ),
    ];
    const skuUnits = allSkuCodes.length
      ? await SKUModel.find(
          { sku_code: { $in: allSkuCodes } },
          { product_varient_id: 1, sku_code: 1, is_deleted: 1, _id: 0 }
        ).lean()
      : [];
    const skuDeletedByKey = new Map(
      skuUnits.map((u) => [`${u.product_varient_id}:${u.sku_code}`, Boolean(u.is_deleted)])
    );

    const items = rawItems.map((order) => ({
      order_id: order.order_id,
      order_number: order.order_number,
      user_id: order.user_id,
      customer_name: order.customer_name ?? null,
      customer_email: order.customer_email ?? null,
      customer_phone: order.customer_phone ?? null,
      address_id: order.address_id,
      products: (order.products ?? []).map((line: OrderLineItemData) => ({
        product_id: line.product_id,
        product_variant_id: line.product_variant_id,
        sku_units: (line.sku ?? []).map((sku) => ({
          sku,
          is_deleted: skuDeletedByKey.get(`${line.product_variant_id}:${sku}`) ?? false,
        })),
        GST: line.GST ?? null,
        product_name: line.product_name,
        variant_combination: line.variant_combination,
        quantity: line.quantity,
        price: line.price,
        discount_price: line.discount_price,
        inventory_managed: line.inventory_managed,
      })),
      total_product: order.total_product,
      total_price: order.total_price,
      tax_total: order.tax_total ?? 0,
      discount_price: order.discount_price,
      status: order.status,
      payment_id: order.payment_id,
      payment: toPaymentSummary(order.PaymentDetails ?? null),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    return { ...buildPaginatedResult(items, total, page, limit), summary };
  } catch (error) {
    return toServiceError(error);
  }
};

const applyOrderStatus = async (order_id: string, status: OrderStatus) => {
  const order = await OrderModel.findOne({ order_id, is_deleted: false });
  if (!order) {
    return { status: CONSTANT.HTTP_STATUS.NOT_FOUND, message: CONSTANT.STATUS.NOT_FOUND };
  }
  if (TERMINAL_STATUSES.includes(order.status as OrderStatus)) {
    return {
      status: CONSTANT.HTTP_STATUS.BAD_REQUEST,
      message: `Order is already ${order.status} and cannot be transitioned further`,
    };
  }

  if (status !== "CANCELLED") {
    order.status = status;
    await order.save();
    return order.toObject();
  }

  try {
    await restockOrderLines(
      { order_id: order.order_id, products: order.products as unknown as OrderLineItemData[] },
      "CANCEL_RESTOCK"
    );
    await OrderModel.updateOne({ order_id }, { status: "CANCELLED" });
    return { ...order.toObject(), status: "CANCELLED" };
  } catch (error) {
    return toServiceError(error);
  }
};

const updateOrdersStatus = async (ids: string[], status: OrderStatus) => {
  const results = await Promise.all(ids.map((order_id) => applyOrderStatus(order_id, status)));
  const updated = results.filter((r) => !isServiceError(r)).length;
  return { updated, total: ids.length };
};

const deleteOrder = async (ids: string[]) => {
  try {
    const orders = await OrderModel.find({
      order_id: { $in: ids },
      is_deleted: false,
    });

    if (!orders.length) {
      return {
        status: CONSTANT.HTTP_STATUS.NOT_FOUND,
        message: CONSTANT.STATUS.NOT_FOUND,
      };
    }

    const result = await OrderModel.updateMany(
      {
        order_id: { $in: ids },
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
    return { deleted: result.modifiedCount, }


  } catch (error) {
    return toServiceError(error);
  }
};


const hardDeleteOrders = async (ids: string[]) => {
  try {
    const result = await OrderModel.deleteMany({ order_id: { $in: ids } });
    return { deleted: result.deletedCount };
  } catch (error) {
    return toServiceError(error);
  }
};

export const orderService = {
  createOrder,
  readOrder,
  listOrders,
  updateOrdersStatus,
  deleteOrder,
  hardDeleteOrders,
  restockOrderLines,
};
