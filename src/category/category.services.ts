import { randomBytes } from "crypto";
import { CONSTANT } from "../../packages/constants";
import { buildPaginatedResult } from "../../packages/utils";
import type { PaginationParams } from "../../packages/utils";
import { CategoryModel } from "../models/category.model";
import { productModel } from "../models/product.model";
import type {
  CategoryCreateRequest,
  CategoryUpdateRequest,
  CategoryBulkStatusRequest,
  CategoryListItem,
  CategoryListSummary,
} from "./category.type";

const findCategoryByName = (category_name: string) =>
  CategoryModel.findOne({
    category_name: category_name.toLowerCase(),
    is_deleted: false,
  });

// for creating time its paylaod will be category_name = "", category_image= "" , category_description = "", sub_category_names = ["sub_category","sub_category","sub_category"]

const createCategory = async (payload: CategoryCreateRequest) => {
  try {
    const existing = await findCategoryByName(payload.category_name);

    if (existing) {
      return {
        status: CONSTANT.HTTP_STATUS.CONFLICT,
        message: CONSTANT.PAYLOAD.RECORD_ALREADY_EXIST,
      };
    }

    // Create parent category
    const category = await CategoryModel.create({
      category_id: randomBytes(6).toString("hex"),
      category_name: payload.category_name,
      category_image: payload.category_image,
      category_description: payload.category_description ?? null,
    });

    // Create sub-categories
    const subCategoryPromises = (payload.sub_category_names ?? []).map(
      (sub_category_name) => {
        return CategoryModel.create({
          category_id: randomBytes(6).toString("hex"),
          category_name: sub_category_name,
          parent_id: category.category_id,
          category_image: null,
          category_description: null,
        });
      },
    );

    const subCategories = await Promise.all(subCategoryPromises);

    return {
      status: CONSTANT.HTTP_STATUS.CREATED,
      message: CONSTANT.PAYLOAD.RECORD_CREATED_SUCCESSFULLY,
      data: {
        category,
        sub_categories: subCategories,
      },
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

const updateCategory = async (
  category_id: string,
  payload: CategoryUpdateRequest,
) => {
  try {
    const category = await CategoryModel.findOne({
      category_id,
      is_deleted: false,
    });

    if (!category) {
      return {
        status: CONSTANT.HTTP_STATUS.NOT_FOUND,
        message: CONSTANT.STATUS.NOT_FOUND,
      };
    }

    // If category name is being updated, check duplicate
    if (
      payload.category_name &&
      payload.category_name.trim() !== category.category_name
    ) {
      const duplicate = await CategoryModel.findOne({
        category_id: { $ne: category_id },
        category_name: payload.category_name.trim(),
        parent_id: category.parent_id ?? null,
        is_deleted: false,
      });

      if (duplicate) {
        return {
          status: CONSTANT.HTTP_STATUS.CONFLICT,
          message: CONSTANT.PAYLOAD.RECORD_ALREADY_EXIST,
        };
      }

      payload.category_name = payload.category_name.trim();
    }

    // Do not allow changing parent_id through this API
    // unless you specifically want to support moving categories.
    delete (payload as Partial<CategoryUpdateRequest>).parent_id;

    const updatedCategory = await CategoryModel.findOneAndUpdate(
      {
        category_id,
        is_deleted: false,
      },
      payload,
      {
        new: true,
        runValidators: true,
      },
    );

    // Cascade: changing a parent category's status (Draft/Live/Hidden)
    // should carry the same status down to all of its sub-categories.
    if (!category.parent_id && payload.status) {
      await CategoryModel.updateMany(
        { parent_id: category_id, is_deleted: false },
        { status: payload.status },
      );
    }

    return updatedCategory;
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

const deleteCategory = async (ids: string[]) => {
  try {
    if (!ids?.length) {
      return {
        status: CONSTANT.HTTP_STATUS.BAD_REQUEST,
        message: "Category IDs are required",
      };
    }

    // Soft delete selected categories
    const categories = await CategoryModel.find({
      category_id: { $in: ids },
      is_deleted: false,
    }).select("category_id");

    if (!categories.length) {
      return {
        status: CONSTANT.HTTP_STATUS.NOT_FOUND,
        message: CONSTANT.STATUS.NOT_FOUND,
      };
    }

    const categoryIds = categories.map((category) => category.category_id);

    const parent_category = await CategoryModel.updateMany(
      {
        category_id: { $in: categoryIds },
        is_deleted: false,
      },
      {
        $set: {
          is_deleted: true,
        },
      },
    );

    // Cascade soft delete to direct sub-categories
    const sub_category = await CategoryModel.updateMany(
      {
        parent_id: { $in: categoryIds },
        is_deleted: false,
      },
      {
        $set: {
          is_deleted: true,
        },
      },
    );

    return {
      deleted: {
        parent_category: parent_category.modifiedCount,
        sub_category: sub_category.modifiedCount,
      },
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

const hardDeleteCategories = async (ids: string[]) => {
  try {
    // Cascade: pull in sub-categories of any parent ids being deleted.
    const subCategories = await CategoryModel.find({
      parent_id: { $in: ids },
    }).lean();

    const allIds = [
      ...new Set([...ids, ...subCategories.map((c) => c.category_id)]),
    ];

    const result = await CategoryModel.deleteMany({
      category_id: { $in: allIds },
    });

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

const updateCategoriesStatus = async (
  ids: string[],
  status: CategoryBulkStatusRequest["status"],
) => {
  try {
    const result = await CategoryModel.updateMany(
      {
        $or: [{ category_id: { $in: ids } }, { parent_id: { $in: ids } }],
        is_deleted: false,
      },
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

const readCategory = async (category_id: string) => {
  try {
    const category = await CategoryModel.findOne({
      category_id,
      is_deleted: false,
    }).lean();

    if (!category) {
      return {
        status: CONSTANT.HTTP_STATUS.NOT_FOUND,
        message: CONSTANT.STATUS.NOT_FOUND,
      };
    }

    const subCategories = await CategoryModel.find({
      parent_id: category_id,
      is_deleted: false,
    }).lean();

    return {
      ...category,
      sub_category: subCategories.length
        ? subCategories.map((sub) => ({
            category_id: sub.category_id,
            sub_category_name: sub.category_name,
          }))
        : null,
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

const listCategories = async ({
  page,
  limit,
  query,
  status,
}: PaginationParams & { query?: string , status? : string}) => {
  try {
    const baseFilter: Record<string, unknown> = { is_deleted: false };

    if (query) {
      baseFilter.category_name = { $regex: `^${query}`, $options: "i" };
    }

    if (status) {
      baseFilter.status = { $regex: `^${status}$`, $options: "i" };
    }

    const skip = (page - 1) * limit;

    const [result] = await CategoryModel.aggregate<{
      items: CategoryListItem[];
      total: { count: number }[];
      statusCounts: { _id: string; count: number }[];
    }>([
      { $match: baseFilter },

      { $match: { parent_id: null } },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          items: [
            { $skip: skip },
            { $limit: limit },

            {
              $lookup: {
                from: CategoryModel.collection.name,
                localField: "parent_id",
                foreignField: "category_id",
                as: "parentCategory",
              },
            },
            {
              $unwind: {
                path: "$parentCategory",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
            
              $lookup: {
                from: CategoryModel.collection.name,
                localField: "category_id",
                foreignField: "parent_id",
                as: "subCategories",
              },
            },
            {
              $lookup: {
                from: productModel.collection.name,
                let: {
                  categoryId: "$category_id",
                  subCategoryIds: "$subCategories.category_id",
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $or: [
                          { $eq: ["$category", "$$categoryId"] },
                          { $in: ["$sub_category", "$$subCategoryIds"] },
                        ],
                      },
                    },
                  },
                  { $count: "count" },
                ],
                as: "productCount",
              },
            },
            {
              $project: {
                _id: 0,
                category_id: 1,
                category_name: 1,
                parent_category_name: "$parentCategory.category_name",
                status: 1,
                total_product: {
                  $ifNull: [{ $arrayElemAt: ["$productCount.count", 0] }, 0],
                },
                sub_category: {
                  $map: {
                    input: "$subCategories",
                    as: "subCategory",
                    in: {
                      category_id: "$$subCategory.category_id",
                      category_name: "$$subCategory.category_name",
                    },
                  },
                },
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
          total: [{ $count: "count" }],
          statusCounts: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
        },
      },
    ]);

    const items: CategoryListItem[] = result?.items ?? [];
    const total: number = result?.total?.[0]?.count ?? 0;

    const countByStatus = new Map<string, number>(
      (result?.statusCounts ?? []).map((s: { _id: string; count: number }) => [
        s._id,
        s.count,
      ]),
    );

    const summary: CategoryListSummary = {
      totalCategory: total,
      total_category_live: countByStatus.get("Live") ?? 0,
      total_category_hidden: countByStatus.get("Hidden") ?? 0,
      total_category_draft: countByStatus.get("Draft") ?? 0,
    };

    return {
      ...buildPaginatedResult(items, total, page, limit),
      summary,
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

export const categoryService = {
  createCategory,
  updateCategory,
  deleteCategory,
  hardDeleteCategories,
  updateCategoriesStatus,
  readCategory,
  listCategories,
};
