/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: >
 *     Manage the product category tree. Categories are self-referential
 *     (a top-level category has `parent_id: null`; a sub-category points at
 *     its parent's `category_id`). Soft-deleting or bulk-status-updating a
 *     top-level category cascades to its direct sub-categories; hard-deleting
 *     by id also cascades to any sub-categories of the ids given. All routes
 *     require a Bearer admin JWT.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CategoryRecord:
 *       type: object
 *       description: Raw category document as stored in MongoDB.
 *       properties:
 *         _id: { type: string, example: 66f1c2b8a1e4d2c3b4a5f6e7 }
 *         category_id: { type: string, example: a1b2c3d4e5f6 }
 *         category_name:
 *           type: string
 *           example: electronics
 *           description: "Stored lowercase (schema applies lowercase=true)."
 *         parent_id:
 *           type: string
 *           nullable: true
 *           example: null
 *           description: null for a top-level category, otherwise the parent's category_id.
 *         category_image:
 *           type: string
 *           nullable: true
 *           example: https://cdn.example.com/categories/electronics.png
 *           description: Required for a top-level category (no parent_id); always null for a sub-category.
 *         category_description: { type: string, nullable: true, example: null }
 *         is_deleted: { type: boolean, example: false }
 *         status: { type: string, enum: [Draft, Live, Hidden], example: Live }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     CategoryCreateRequest:
 *       type: object
 *       required: [category_name, category_image]
 *       properties:
 *         category_name: { type: string, example: Electronics }
 *         parent_id:
 *           type: string
 *           nullable: true
 *           description: >
 *             Accepted by the schema but ignored by the create flow — creating
 *             sub-categories is done exclusively via `sub_category_names`
 *             below, not by passing a `parent_id` directly.
 *         category_image: { type: string, example: https://cdn.example.com/categories/electronics.png }
 *         category_description: { type: string, nullable: true, example: null }
 *         sub_category_names:
 *           type: array
 *           items: { type: string }
 *           example: [Mobiles, Laptops]
 *           description: >
 *             Each name creates a sub-category under the newly created parent
 *             in the same call, with parent_id set to the new category's id
 *             and category_image/category_description both null.
 *         status: { type: string, enum: [Draft, Live, Hidden], example: Live }
 *     CategoryUpdateRequest:
 *       type: object
 *       description: >
 *         All fields optional. `parent_id` is deliberately stripped by the
 *         service before saving — this endpoint cannot move a category to a
 *         different parent. If `status` is set on a top-level category
 *         (parent_id is null), the same status is cascaded to all of its
 *         direct sub-categories.
 *       properties:
 *         category_name: { type: string, example: Consumer Electronics }
 *         category_image: { type: string }
 *         category_description: { type: string, nullable: true }
 *         sub_category_names:
 *           type: array
 *           items: { type: string }
 *           description: Accepted by the schema but not read by the update service logic.
 *         status: { type: string, enum: [Draft, Live, Hidden] }
 *     CategoryBulkIdsRequest:
 *       type: object
 *       required: [ids]
 *       properties:
 *         ids:
 *           type: array
 *           minItems: 1
 *           items: { type: string }
 *           example: [a1b2c3d4e5f6, f6e5d4c3b2a1]
 *     CategoryBulkStatusRequest:
 *       type: object
 *       required: [ids, status]
 *       properties:
 *         ids:
 *           type: array
 *           minItems: 1
 *           items: { type: string }
 *           example: [a1b2c3d4e5f6]
 *         status: { type: string, enum: [Draft, Live, Hidden], example: Hidden }
 *     CategorySubCategoryRef:
 *       type: object
 *       description: Shape used only inside the `sub_category` array of a "read single category" response.
 *       properties:
 *         category_id: { type: string, example: f6e5d4c3b2a1 }
 *         sub_category_name: { type: string, example: mobiles }
 *     CategoryDetailResponse:
 *       type: object
 *       description: >
 *         The category document plus its own direct sub-categories (one level
 *         only). `sub_category` is null when there are none.
 *       allOf:
 *         - $ref: '#/components/schemas/CategoryRecord'
 *         - type: object
 *           properties:
 *             sub_category:
 *               type: array
 *               nullable: true
 *               items: { $ref: '#/components/schemas/CategorySubCategoryRef' }
 *     CategoryListItem:
 *       type: object
 *       description: >
 *         One row of the category dashboard listing. IMPORTANT: this listing
 *         only ever contains sub-categories (rows whose parent_id is not
 *         null) — top-level parent categories themselves are excluded from
 *         `GET /v1/categories`. `total_product` counts products whose
 *         `sub_category` field equals this row's category_id.
 *       properties:
 *         category_id: { type: string, example: f6e5d4c3b2a1 }
 *         category_name: { type: string, example: mobiles }
 *         parent_category_name:
 *           type: string
 *           nullable: true
 *           example: electronics
 *           description: Name of the parent category, or null if the parent lookup found nothing.
 *         status: { type: string, enum: [Draft, Live, Hidden] }
 *         total_product: { type: integer, example: 4200 }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     CategoryListSummary:
 *       type: object
 *       description: >
 *         Counts computed over the same filtered set as the listing (i.e.
 *         sub-categories only, after any query/status filter), not over all
 *         categories in the collection.
 *       properties:
 *         totalCategory: { type: integer, example: 148 }
 *         total_category_live: { type: integer, example: 120 }
 *         total_category_hidden: { type: integer, example: 18 }
 *         total_category_draft: { type: integer, example: 10 }
 *     CategoryPaginatedListResponse:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items: { $ref: '#/components/schemas/CategoryListItem' }
 *         total: { type: integer, example: 148 }
 *         page: { type: integer, example: 1 }
 *         limit: { type: integer, example: 20 }
 *         totalPages: { type: integer, example: 8 }
 *         summary: { $ref: '#/components/schemas/CategoryListSummary' }
 *     CategoryCreateResponseData:
 *       type: object
 *       properties:
 *         category: { $ref: '#/components/schemas/CategoryRecord' }
 *         sub_categories:
 *           type: array
 *           items: { $ref: '#/components/schemas/CategoryRecord' }
 *     CategorySoftDeleteResponseData:
 *       type: object
 *       properties:
 *         deleted:
 *           type: object
 *           properties:
 *             parent_category:
 *               type: integer
 *               example: 1
 *               description: Number of documents matched by the given ids that were soft-deleted.
 *             sub_category:
 *               type: integer
 *               example: 3
 *               description: Number of direct sub-categories of those ids that were also soft-deleted.
 *     CategoryHardDeleteResponseData:
 *       type: object
 *       properties:
 *         deleted:
 *           type: integer
 *           example: 4
 *           description: Total documents permanently removed (given ids plus any of their sub-categories, deduplicated), regardless of is_deleted state.
 *     CategoryBulkStatusResponseData:
 *       type: object
 *       properties:
 *         updated:
 *           type: integer
 *           example: 5
 *           description: Count of documents modified — matches on the given ids OR any category whose parent_id is one of the given ids.
 *     CategoryErrorResponse:
 *       type: object
 *       properties:
 *         status: { type: integer, example: 404 }
 *         message: { type: string, example: Not Found }
 */

/**
 * @swagger
 * /v1/categories:
 *   get:
 *     summary: List categories (dashboard table — top-level categories only, paginated)
 *     description: >
 *       Returns only top-level category rows (documents with parent_id: null);
 *       sub-categories are never included in this listing. Because these rows
 *       have no parent of their own, `parent_category_name` is always null
 *       here. Each row's `total_product` counts products tagged directly to
 *       it (product.category) plus products tagged to any of its own direct
 *       sub-categories (product.sub_category).
 *     tags: [Categories]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *         description: Clamped between 1 and 100.
 *       - in: query
 *         name: query
 *         schema: { type: string }
 *         description: Case-insensitive prefix match against category_name (matched as `^query`).
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Draft, Live, Hidden] }
 *         description: Case-insensitive exact match against status.
 *     responses:
 *       200:
 *         description: Categories fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Fetched Successfully }
 *                 data: { $ref: '#/components/schemas/CategoryPaginatedListResponse' }
 *       401:
 *         description: Missing/invalid bearer token.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoryErrorResponse' }
 *       500:
 *         description: Unexpected server error.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoryErrorResponse' }
 *   post:
 *     summary: Create a top-level category, optionally with sub-categories in the same call
 *     description: >
 *       NOTE: `category.routes.ts` registers a second `router.post("/", ...)`
 *       further down (intended as a bulk soft-delete-by-ids route — see the
 *       "known issue" callout on this path's DELETE-shaped operation below).
 *       Because Express matches routes in registration order and this create
 *       handler always sends a response without calling `next()`, that later
 *       route is currently unreachable — every POST to this path creates a
 *       category, it never deletes one.
 *     tags: [Categories]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CategoryCreateRequest' }
 *     responses:
 *       201:
 *         description: Category (and any sub-categories) created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 201 }
 *                 message: { type: string, example: Record Created Successfully }
 *                 data: { $ref: '#/components/schemas/CategoryCreateResponseData' }
 *       400:
 *         description: Body failed Zod validation (e.g. missing category_name/category_image).
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoryErrorResponse' }
 *       401:
 *         description: Missing/invalid bearer token.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoryErrorResponse' }
 *       409:
 *         description: A non-deleted category with the same (lowercased) category_name already exists.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoryErrorResponse' }
 *       500:
 *         description: Unexpected server error.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoryErrorResponse' }
 *   patch:
 *     summary: Update a category (identified by ?category_id=)
 *     description: >
 *       parent_id cannot be changed through this endpoint (stripped server-side).
 *       Setting `status` on a top-level category cascades that status to its
 *       direct sub-categories.
 *     tags: [Categories]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: category_id
 *         required: true
 *         schema: { type: string }
 *         example: a1b2c3d4e5f6
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CategoryUpdateRequest' }
 *     responses:
 *       200:
 *         description: Category updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Updated Successfully }
 *                 data: { $ref: '#/components/schemas/CategoryRecord' }
 *       400:
 *         description: Body failed Zod validation.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoryErrorResponse' }
 *       401:
 *         description: Missing/invalid bearer token.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoryErrorResponse' }
 *       404:
 *         description: No non-deleted category with that category_id.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoryErrorResponse' }
 *       409:
 *         description: Another category already uses the new category_name under the same parent.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoryErrorResponse' }
 *       500:
 *         description: Unexpected server error.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoryErrorResponse' }
 */

/**
 * @swagger
 * /v1/categories/details:
 *   get:
 *     summary: Read a single category (identified by ?category_id=), with its direct sub-categories
 *     tags: [Categories]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: category_id
 *         required: true
 *         schema: { type: string }
 *         example: a1b2c3d4e5f6
 *     responses:
 *       200:
 *         description: Category fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Fetched Successfully }
 *                 data: { $ref: '#/components/schemas/CategoryDetailResponse' }
 *       401:
 *         description: Missing/invalid bearer token.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoryErrorResponse' }
 *       404:
 *         description: No non-deleted category with that category_id.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoryErrorResponse' }
 *       500:
 *         description: Unexpected server error.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoryErrorResponse' }
 */

/**
 * @swagger
 * /v1/categories/hard-delete:
 *   post:
 *     summary: Permanently delete categories by id (bulk, irreversible, cascades to sub-categories of the given ids)
 *     description: >
 *       Removes documents outright (bypasses is_deleted / soft-delete
 *       entirely — matches regardless of current is_deleted state). Any
 *       category whose parent_id is one of the given ids is deleted too, in
 *       the same call.
 *     tags: [Categories]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CategoryBulkIdsRequest' }
 *     responses:
 *       200:
 *         description: Categories permanently deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Deleted Successfully }
 *                 data: { $ref: '#/components/schemas/CategoryHardDeleteResponseData' }
 *       400:
 *         description: Body failed Zod validation (ids missing/empty).
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoryErrorResponse' }
 *       401:
 *         description: Missing/invalid bearer token.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoryErrorResponse' }
 *       500:
 *         description: Unexpected server error.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoryErrorResponse' }
 */

/**
 * @swagger
 * /v1/categories/status:
 *   patch:
 *     summary: Bulk update the status of categories by id (also cascades to any sub-categories of the given ids)
 *     description: >
 *       Matches every document whose category_id is in `ids` OR whose
 *       parent_id is in `ids` (and is not soft-deleted), and sets its status
 *       to the given value.
 *     tags: [Categories]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CategoryBulkStatusRequest' }
 *     responses:
 *       200:
 *         description: Status updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Updated Successfully }
 *                 data: { $ref: '#/components/schemas/CategoryBulkStatusResponseData' }
 *       400:
 *         description: Body failed Zod validation (ids/status missing or status not one of the enum values).
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoryErrorResponse' }
 *       401:
 *         description: Missing/invalid bearer token.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoryErrorResponse' }
 *       500:
 *         description: Unexpected server error.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/CategoryErrorResponse' }
 */
