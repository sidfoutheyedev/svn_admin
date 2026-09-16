import { randomBytes } from "crypto";
import { CONSTANT } from "../../packages/constants";
import { buildPaginatedResult } from "../../packages/utils";
import type { PaginationParams } from "../../packages/utils";
import { PaymentModel } from "../models/payment.model";
import { OrderModel } from "../models/order.model";
import type { PaymentCreateRequest, PaymentStatus } from "./payment.type";

const generateId = () => randomBytes(6).toString("hex");

const toServiceError = (error: unknown) => ({
    status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message:
        error instanceof Error
            ? error.message
            : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
});

const createPayment = async (payload: PaymentCreateRequest) => {
    try {
        const order = await OrderModel.findOne({
            order_id: payload.order_id,
            is_deleted: false,
        });
        if (!order) {
            return {
                status: CONSTANT.HTTP_STATUS.BAD_REQUEST,
                message: "Order not found",
            };
        }

        const payment_id = generateId();
        const status = payload.status ?? "PENDING";

        const payment = await PaymentModel.create({
            payment_id,
            order_id: payload.order_id,
            transaction_id: payload.transaction_id ?? null,
            payment_mode: payload.payment_mode,
            amount: payload.amount,
            status,
        });

        order.payment_id = payment_id;
        if (status === "SUCCESS" && order.status === "PENDING") {
            order.status = "CONFIRMED";
        }
        await order.save();

        return payment;
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

const readPayment = async (payment_id: string) => {
    try {
        const payment = await PaymentModel.findOne({
            payment_id,
            is_deleted: false,
        });
        if (!payment) {
            return {
                status: CONSTANT.HTTP_STATUS.NOT_FOUND,
                message: CONSTANT.STATUS.NOT_FOUND,
            };
        }
        return payment;
    } catch (error) {
        return toServiceError(error);
    }
};

const listPayments = async ({
    page,
    limit,
    skip,
    order_id,
    status,
    query,
}: PaginationParams & {
    order_id?: string;
    status?: PaymentStatus;
    query?: string;
}) => {
    try {
        const filter: Record<string, unknown> = { is_deleted: false };
        if (order_id) filter.order_id = order_id;
        if (status) filter.status = status;

        if (query?.trim()) {
            const search = query.trim();
            filter.$or = [
                { payment_id: { $regex: search, $options: "i" } },
                { order_id: { $regex: search, $options: "i" } },
                { transaction_id: { $regex: search, $options: "i" } },
            ];
        }

        const [items, total] = await Promise.all([
            PaymentModel.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            PaymentModel.countDocuments(filter),
        ]);

        return buildPaginatedResult(items, total, page, limit);
    } catch (error) {
        return toServiceError(error);
    }
};

const updatePaymentsStatus = async (ids: string[], status: PaymentStatus) => {
    try {
        const result = await PaymentModel.updateMany(
            { payment_id: { $in: ids }, is_deleted: false },
            { status },
        );

        if (status === "SUCCESS") {
            const payments = await PaymentModel.find(
                { payment_id: { $in: ids } },
                { order_id: 1 },
            ).lean();
            const orderIds = payments.map((p) => p.order_id);
            if (orderIds.length) {
                await OrderModel.updateMany(
                    { order_id: { $in: orderIds }, status: "PENDING" },
                    { status: "CONFIRMED" },
                );
            }
        }

        return { updated: result.modifiedCount };
    } catch (error) {
        return toServiceError(error);
    }
};

const deletePayment = async (ids: string[]) => {
    try {
        if (!ids.length) {
            return {
                status: CONSTANT.HTTP_STATUS.BAD_REQUEST,
                message: "Payment_id is required",
            };
        }

        const result = await PaymentModel.updateMany(
            {
                payment_id: { $in: ids },
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
                message: CONSTANT.STATUS.NOT_FOUND
            }
        }

        return {
            deleted: result.modifiedCount
        }

    } catch (error) {
        return toServiceError(error);
    }
};

const hardDeletePayments = async (ids: string[]) => {
    try {
        const result = await PaymentModel.deleteMany({ payment_id: { $in: ids } });
        return { deleted: result.deletedCount };
    } catch (error) {
        return toServiceError(error);
    }
};

export const paymentService = {
    createPayment,
    readPayment,
    listPayments,
    updatePaymentsStatus,
    deletePayment,
    hardDeletePayments,
};
