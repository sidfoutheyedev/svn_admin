import { randomBytes } from "crypto";
import { CONSTANT } from "../../packages/constants";
import { buildPaginatedResult } from "../../packages/utils";
import type { PaginationParams } from "../../packages/utils";
import { VarientModel } from "../models/varient.model";
import type {
    VarientCreateRequest,
    VarientUpdateRequest,
    VarientBulkStatusRequest,
    VarientListSummary,
} from "./varient.type";

const findVarientByName = (varient_name: string) =>
    VarientModel.findOne({ varient_name, is_deleted: false });

const createVarient = async (payload: VarientCreateRequest) => {
    try {
        const existing = await findVarientByName(payload.varient_name);

        if (existing) {
            return {
                status: CONSTANT.HTTP_STATUS.CONFLICT,
                message: CONSTANT.PAYLOAD.RECORD_ALREADY_EXIST,
            };
        }

        const varient = await VarientModel.create({
            varient_id: randomBytes(6).toString("hex"),
            varient_name: payload.varient_name,
            varient_values: payload.varient_values,
            status: payload.status ?? "Live",
        });

        return varient;
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

const updateVarient = async (
    varient_id: string,
    payload: VarientUpdateRequest,
) => {
    try {
        const varient = await VarientModel.findOneAndUpdate(
            { varient_id, is_deleted: false },
            payload,
            { new: true, runValidators: true },
        );

        if (!varient) {
            return {
                status: CONSTANT.HTTP_STATUS.NOT_FOUND,
                message: CONSTANT.STATUS.NOT_FOUND,
            };
        }

        return varient;
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

const deleteVarient = async (ids: string[]) => {
    try {
        if (ids.length === 0) {
            return {
                status: CONSTANT.HTTP_STATUS.CONFLICT,
                message: "Brand IDs are required",
            };
        }

        const result = await VarientModel.updateMany(
            {
                varient_id: { $in: ids },
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
        return {
            status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
            message:
                error instanceof Error
                    ? error.message
                    : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
        };
    }
};

const hardDeleteVarients = async (ids: string[]) => {
    try {
        const result = await VarientModel.deleteMany({ varient_id: { $in: ids } });

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

const updateVarientsStatus = async (
    ids: string[],
    status: VarientBulkStatusRequest["status"],
) => {
    try {
        const result = await VarientModel.updateMany(
            { varient_id: { $in: ids }, is_deleted: false },
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

const readVarient = async (varient_id: string) => {
    try {
        const varient = await VarientModel.findOne({
            varient_id,
            is_deleted: false,
        });

        if (!varient) {
            return {
                status: CONSTANT.HTTP_STATUS.NOT_FOUND,
                message: CONSTANT.STATUS.NOT_FOUND,
            };
        }

        return varient;
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

const listVarients = async ({
    page,
    limit,
    skip,
    query,
    status
}: PaginationParams & { query?: string; status?: string }) => {
    try {
        // Shared by the list and the status summary — everything except the
        // status filter itself, so the summary always reflects all statuses
        // (search still narrows it, matching the list's own search scope).
        const searchFilter: Record<string, unknown> = { is_deleted: false };

        if (query) {
            searchFilter.$or = [
                { varient_name: { $regex: `^${query}`, $options: "i" } },
                { varient_values: { $regex: query, $options: "i" } },
            ];
        }

        const filter: Record<string, unknown> = { ...searchFilter };

        if (status) {
            filter.status = { $regex: `^${status}$`, $options: "i" };
        }

        const [items, total, statusCounts] = await Promise.all([
            VarientModel.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            VarientModel.countDocuments(filter),
            VarientModel.aggregate([
                { $match: searchFilter },
                { $group: { _id: "$status", count: { $sum: 1 } } },
            ]),
        ]);

        const countByStatus = new Map<string, number>(
            statusCounts.map((s: { _id: string; count: number }) => [s._id, s.count]),
        );

        const total_live_varient = countByStatus.get("Live") ?? 0;
        const total_draft_vatient = countByStatus.get("Draft") ?? 0;
        const total_hidden_varient = countByStatus.get("Hidden") ?? 0;

        const summary: VarientListSummary = {
            total_varient: total_live_varient + total_draft_vatient + total_hidden_varient,
            total_live_varient,
            total_draft_vatient,
            total_hidden_varient,
        };

        return { ...buildPaginatedResult(items, total, page, limit), summary };
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

export const varientService = {
    createVarient,
    updateVarient,
    deleteVarient,
    hardDeleteVarients,
    updateVarientsStatus,
    readVarient,
    listVarients,
};
