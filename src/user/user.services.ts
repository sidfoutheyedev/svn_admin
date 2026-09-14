import type { PipelineStage } from "mongoose";
import { CONSTANT } from "../../packages/constants";
import { buildPaginatedResult } from "../../packages/utils";
import type { PaginationParams } from "../../packages/utils";
import { UserModel } from "../models/user.model";
import { UserProfileModel } from "../models/profile.model";
import UserPreferencesModel from "../models/user_preferences.model";
import { PreferencesModel } from "../models/preferences.model";
import { CategoryModel } from "../models/category.model";
import type { StyleDna, StyleDnaSlice, UserListSummary, UserStatus } from "./user.type";

const largestRemainderPercentages = (values: number[]): number[] => {
    const total = values.reduce((sum, value) => sum + value, 0);

    if (total === 0) {
        return values.map(() => 0);
    }

    const shares = values.map((value) => (value / total) * 100);
    const floors = shares.map((share) => Math.floor(share));
    const remainder = 100 - floors.reduce((sum, value) => sum + value, 0);

    const byRemainingFraction = shares
        .map((share, index) => ({ index, fraction: share - Math.floor(share) }))
        .sort((a, b) => b.fraction - a.fraction);

    const percentages = [...floors];
    for (let i = 0; i < remainder; i++) {
        percentages[byRemainingFraction[i].index] += 1;
    }

    return percentages;
};

const styleDnaFor = async (user_id: string): Promise<StyleDna> => {
    const [result] = await UserPreferencesModel.aggregate([
        { $match: { user_id } },
        { $unwind: "$preference_id" },
        {
            $lookup: {
                from: PreferencesModel.collection.name,
                localField: "preference_id.preference_id",
                foreignField: "preference_id",
                as: "preference",
                pipeline: [{ $match: { is_deleted: false } }],
            },
        },
        { $unwind: "$preference" },
        {
            $lookup: {
                from: CategoryModel.collection.name,
                localField: "preference.category_id",
                foreignField: "category_id",
                as: "category",
                pipeline: [{ $match: { is_deleted: false } }],
            },
        },
        { $unwind: "$category" },
        {
            $project: {
                _id: 0,
                preference_id: "$preference_id.preference_id",
                score: "$preference_id.score",
                label: "$category.category_name",
                description: "$category.category_description",
                priority: "$preference.priority",
            },
        },
        { $sort: { score: -1 as const, priority: -1 as const } },
        { $group: { _id: null, rows: { $push: "$$ROOT" } } },
    ]);

    const rows: Array<{
        preference_id: string;
        score: number;
        label: string;
        description: string | null;
    }> = result?.rows ?? [];

    if (rows.length === 0) {
        return { slices: [], note: null };
    }

    const percentages = largestRemainderPercentages(rows.map((row) => row.score));

    const slices: StyleDnaSlice[] = rows.map((row, index) => ({
        preference_id: row.preference_id,
        label: row.label,
        score: row.score,
        percentage: percentages[index],
    }));

    return { slices, note: rows[0].description ?? null };
};

const listUsers = async ({
    page,
    limit,
    skip,
    query,
    status,
}: PaginationParams & { query?: string; status?: UserStatus }) => {
    try {
        // Shared by the list and the status summary — everything except the
        // status filter itself, so the summary always reflects all statuses
        // (search still narrows it, matching the list's own search scope).
        const searchPipeline: PipelineStage[] = [
            { $match: { is_deleted: false, role: "user" } },
            {
                $lookup: {
                    from: UserProfileModel.collection.name,
                    localField: "user_id",
                    foreignField: "user_id",
                    as: "profile",
                },
            },
            { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },
        ];

        if (query) {
            searchPipeline.push({
                $match: {
                    $or: [
                        { "profile.full_name": { $regex: query, $options: "i" } },
                        { email: { $regex: query, $options: "i" } },
                    ],
                },
            });
        }

        const basePipeline: PipelineStage[] = [
            ...searchPipeline,
            ...(status ? [{ $match: { status } } as PipelineStage] : []),
        ];

        const dataPipeline: PipelineStage[] = [
            ...basePipeline,
            { $sort: { createdAt: -1 as const } },
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    _id: 1,
                    user_id: 1,
                    email: 1,
                    status: 1,
                    lastLogin: 1,
                    createdAt: 1,
                    full_name: "$profile.full_name",
                    phone: "$profile.phone",
                    dob: "$profile.dob",
                    gender: "$profile.gender",
                },
            },
        ];

        const countPipeline: PipelineStage[] = [...basePipeline, { $count: "total" }];

        const statusCountPipeline: PipelineStage[] = [
            ...searchPipeline,
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ];

        const [items, countResult, statusCounts] = await Promise.all([
            UserModel.aggregate(dataPipeline),
            UserModel.aggregate(countPipeline),
            UserModel.aggregate(statusCountPipeline),
        ]);

        const total = countResult[0]?.total ?? 0;

        const countByStatus = new Map<string, number>(
            statusCounts.map((s: { _id: string; count: number }) => [s._id, s.count]),
        );
        const total_active_user = countByStatus.get("active") ?? 0;
        const total_inactive_user = countByStatus.get("inactive") ?? 0;
        const total_suspended_user = countByStatus.get("suspended") ?? 0;

        const summary: UserListSummary = {
            total_user: total_active_user + total_inactive_user + total_suspended_user,
            total_active_user,
            total_inactive_user,
            total_suspended_user,
        };

        return { ...buildPaginatedResult(items, total, page, limit), summary };
    } catch (error) {
        return {
            status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
            message: error instanceof Error ? error.message : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
        };
    }
};

const updateUserStatus = async (user_ids: string[], status: UserStatus) => {
    try {
        const result = await UserModel.updateMany(
            { user_id: { $in: user_ids }, is_deleted: false },
            { status }
        );

        return { updated: result.modifiedCount };
    } catch (error) {
        return {
            status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
            message: error instanceof Error ? error.message : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
        };
    }
};

const removeUsers = async (user_ids: string[]) => {
    try {
        const result = await UserModel.updateMany(
            { user_id: { $in: user_ids }, is_deleted: false },
            { is_deleted: true }
        );

        return { removed: result.modifiedCount };
    } catch (error) {
        return {
            status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
            message: error instanceof Error ? error.message : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
        };
    }
};

const hardRemoveUsers = async (user_ids: string[]) => {
    try {
        const result = await UserModel.deleteMany({ user_id: { $in: user_ids } });

        return { deleted: result.deletedCount };
    } catch (error) {
        return {
            status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
            message: error instanceof Error ? error.message : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
        };
    }
};

const getUserDetails = async (user_id: string) => {
    try {
        const pipeline: PipelineStage[] = [
            { $match: { user_id, is_deleted: false } },
            {
                $lookup: {
                    from: UserProfileModel.collection.name,
                    localField: "user_id",
                    foreignField: "user_id",
                    as: "profile",
                    pipeline: [{ $match: { is_deleted: false } }],
                },
            },
            { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 0,
                    user_id: "$user_id",
                    email: "$email",
                    role: "$role",
                    provider: "$provider",
                    full_name: "$profile.full_name",
                    dob: "$profile.dob",
                    gender: "$profile.gender",
                    profile_images: "$profile.profile_images",
                    phone: "$profile.phone",
                    new_brand_reminder: "$profile.new_brand_reminder",
                    trend_reminder: "$profile.trend_reminder",
                    more_reminder: "$profile.more_reminder",
                    status: "$status",
                    lastLogin: "$lastLogin",
                    createdAt: "$createdAt",
                    updatedAt: "$updatedAt",
                },
            },
        ];

        const [[details], style_dna] = await Promise.all([
            UserModel.aggregate(pipeline),
            styleDnaFor(user_id),
        ]);

        if (!details) {
            return {
                status: CONSTANT.HTTP_STATUS.NOT_FOUND,
                message: CONSTANT.STATUS.NOT_FOUND,
            };
        }

        return { ...details, style_dna };
    } catch (error) {
        return {
            status: CONSTANT.HTTP_STATUS.INTERNAL_SERVER_ERROR,
            message: error instanceof Error ? error.message : CONSTANT.STATUS.SOMETHING_WENT_WRONG,
        };
    }
};

export const userService = {
    listUsers,
    updateUserStatus,
    removeUsers,
    hardRemoveUsers,
    getUserDetails,
};
