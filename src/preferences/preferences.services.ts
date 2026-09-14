import { CONSTANT } from "../../packages/manager";
import { randomBytes } from "crypto";
import {
  buildPaginatedResult,
  type PaginationParams,
} from "../../packages/utils";
import { PreferencesModel } from "../models/preferences.model";
import { CategoryModel } from "../models/category.model";
import { BrandModel } from "../models/brand.model";
import type { preferencesCreateRequest } from "./preferences.type";

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getPreferences = async ({
  page,
  limit,
  query,
}: PaginationParams & { query?: string }) => {
  try {
    const skip = (page - 1) * limit;

    const pipeline = [
      {
        $match: {
          is_deleted: false,
        },
      },
      {
        $lookup: {
          from: "categories",
          let: { categoryId: "$category_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$category_id", "$$categoryId"] },
                is_deleted: false,
              },
            },
          ],
          as: "category",
        },
      },
      {
        $lookup: {
          from: "brands",
          let: { brandIds: "$brand_ids" },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$brand_id", "$$brandIds"] },
                is_deleted: false,
              },
            },
          ],
          as: "brands",
        },
      },
      {
        $project: {
          preference_id: 1,
          category_id: 1,
          category_image: {
            $arrayElemAt: ["$category.category_image", 0],
          },
          category_description: {
            $arrayElemAt: ["$category.category_description", 0],
          },
          category_name: {
            $arrayElemAt: ["$category.category_name", 0],
          },
          brand_ids: 1,
          brand_names: "$brands.brand_name",
          priority: 1,
          status: 1,
          is_deleted: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      ...(query
        ? [
            {
              $match: {
                $or: [
                  {
                    category_name: {
                      $regex: escapeRegex(query),
                      $options: "i",
                    },
                  },
                  {
                    brand_names: {
                      $regex: escapeRegex(query),
                      $options: "i",
                    },
                  },
                ],
              },
            },
          ]
        : []),
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          total: [{ $count: "count" }],
        },
      },
      {
        $project: {
          data: 1,
          total: {
            $ifNull: [{ $arrayElemAt: ["$total.count", 0] }, 0],
          },
        },
      },
    ];

    const [result] = await PreferencesModel.aggregate(pipeline);

    const data = result?.data ?? [];
    const total = result?.total ?? 0;

    return buildPaginatedResult(data, total, page, limit);
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

const createPreferences = async (data: preferencesCreateRequest) => {
  try {
    const existingPreferences = await PreferencesModel.findOne({
      category_id: data.category_id,
      is_deleted: false,
    });

    if (existingPreferences) {
      return {
        status: CONSTANT.HTTP_STATUS.CONFLICT,
        message: CONSTANT.PAYLOAD.RECORD_ALREADY_EXIST,
      };
    }

    const category = await CategoryModel.findOne({
      category_id: data.category_id,
      is_deleted: false,
    });

    if (!category) {
      return {
        status: CONSTANT.HTTP_STATUS.NOT_FOUND,
        message: "Category not found",
      };
    }

    if (category.parent_id) {
      return {
        status: CONSTANT.HTTP_STATUS.BAD_REQUEST,
        message:
          "A preference must reference a main category, not a sub-category",
      };
    }

    const brandCount = await BrandModel.countDocuments({
      brand_id: { $in: data.brand_ids },
      is_deleted: false,
    });

    if (brandCount !== data.brand_ids.length) {
      return {
        status: CONSTANT.HTTP_STATUS.BAD_REQUEST,
        message: "One or more brand_ids do not exist",
      };
    }

    const newPreferences = await PreferencesModel.create({
      preference_id: randomBytes(16).toString("hex"),
      category_id: data.category_id,
      brand_ids: data.brand_ids,
      priority: data.priority,
      status: data.status || "Draft",
    });

    return newPreferences;
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

const updatePreferences = async (
  preference_id: string,
  data: Partial<preferencesCreateRequest>,
) => {
  try {
    const updatedPreference = await PreferencesModel.findOneAndUpdate(
      { preference_id, is_deleted: false },
      data,
      { new: true },
    );

    if (!updatedPreference) {
      return {
        status: CONSTANT.HTTP_STATUS.NOT_FOUND,
        message: CONSTANT.STATUS.NOT_FOUND,
      };
    }

    return updatedPreference;
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

const deletePreferences = async (ids: string | string[]) => {
  try {
    if (!ids || !ids.length) {
      return {
        status: CONSTANT.HTTP_STATUS.BAD_REQUEST,
        message: "Brand IDs are required",
      };
    }

    if (typeof ids === "string") {
      const preference = await PreferencesModel.findOneAndUpdate(
        { preference_id: ids, is_deleted: false },
        { is_deleted: true },
        { new: true },
      );

      return preference ?? {
        status: CONSTANT.HTTP_STATUS.NOT_FOUND,
        message: CONSTANT.STATUS.NOT_FOUND,
      };
    }

    const result = await PreferencesModel.updateMany(
      {
        preference_id: { $in: ids },
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
      deleted: result.matchedCount,
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

const getPreferencesById = async (preference_id: string) => {
  try {
    const preference = await PreferencesModel.findOne({
      preference_id,
      is_deleted: false,
    });

    if (!preference) {
      return {
        status: CONSTANT.HTTP_STATUS.NOT_FOUND,
        message: CONSTANT.STATUS.NOT_FOUND,
      };
    }

    return preference;
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

const updateMultiplePreferences = async (
  preference_ids: string[],
  status: "Draft" | "Live" | "Hidden",
) => {
  try {
    const updatedPreferences = await PreferencesModel.updateMany(
      { preference_id: { $in: preference_ids }, is_deleted: false },
      { status },
    );
    return updatedPreferences;
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

export const preferencesService = {
  getPreferences,
  createPreferences,
  updatePreferences,
  deletePreferences,
  getPreferencesById,
  updateMultiplePreferences,
};
