/**
 * @swagger
 * tags:
 *   name: Preferences
 *   description: >
 *     Admin-curated category/brand preferences used to drive storefront
 *     recommendations. Every route requires a Bearer admin JWT. A preference's
 *     `category_id` is only unique among non-deleted preferences (partial
 *     unique index on `category_id` filtered to `is_deleted: false`), so a
 *     soft-deleted preference's category can immediately be reused by a new
 *     preference. There is no hard-delete endpoint for this module — deletion
 *     is always a soft delete (`is_deleted` flips to `true`) of a single
 *     preference at a time.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PreferenceResponse:
 *       type: object
 *       description: Raw preference document as stored (returned by create, update, get-by-id and delete).
 *       properties:
 *         _id: { type: string, example: 671f2a1b9c8e4a0012ab34cd }
 *         preference_id: { type: string, example: 9f1a2b3c4d5e6f7890ab12cd34ef5678 }
 *         category_id: { type: string, example: category-123 }
 *         brand_ids:
 *           type: array
 *           items: { type: string }
 *           example: [brand-123, brand-456]
 *         priority: { type: integer, minimum: 1, maximum: 10, example: 1 }
 *         status: { type: string, enum: [Draft, Live, Hidden], example: Draft }
 *         is_deleted: { type: boolean, example: false }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     PreferenceListItem:
 *       type: object
 *       description: >
 *         Shape returned by the list endpoint. Unlike PreferenceResponse this is
 *         built via an aggregation pipeline that joins in the category name/image/
 *         description and the resolved brand names (both only from non-deleted
 *         category/brand documents).
 *       properties:
 *         preference_id: { type: string, example: 9f1a2b3c4d5e6f7890ab12cd34ef5678 }
 *         category_id: { type: string, example: category-123 }
 *         category_name: { type: string, nullable: true, example: Sunglasses }
 *         category_image: { type: string, nullable: true, example: https://cdn.example.com/categories/sunglasses.png }
 *         category_description: { type: string, nullable: true, example: All sunglasses styles }
 *         brand_ids:
 *           type: array
 *           items: { type: string }
 *           example: [brand-123, brand-456]
 *         brand_names:
 *           type: array
 *           items: { type: string }
 *           example: [Ray-Ban, Oakley]
 *         priority: { type: integer, minimum: 1, maximum: 10, example: 1 }
 *         status: { type: string, enum: [Draft, Live, Hidden], example: Draft }
 *         is_deleted: { type: boolean, example: false }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     PreferencePaginatedList:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items: { $ref: '#/components/schemas/PreferenceListItem' }
 *         total: { type: integer, example: 1 }
 *         page: { type: integer, example: 1 }
 *         limit: { type: integer, example: 20 }
 *         totalPages: { type: integer, example: 1 }
 *     PreferenceCreateRequest:
 *       type: object
 *       required: [category_id, brand_ids, priority]
 *       properties:
 *         category_id: { type: string, example: category-123 }
 *         brand_ids:
 *           type: array
 *           items: { type: string }
 *           example: [brand-123, brand-456]
 *         priority: { type: integer, minimum: 1, maximum: 10, example: 1 }
 *         status:
 *           type: string
 *           enum: [Draft, Live, Hidden]
 *           default: Draft
 *           description: Defaults to "Draft" when omitted.
 *     PreferenceUpdateRequest:
 *       type: object
 *       description: All fields optional; only supplied fields are changed. Not re-validated against category/brand existence or the category-uniqueness rule the way create is.
 *       properties:
 *         category_id: { type: string, example: category-123 }
 *         brand_ids:
 *           type: array
 *           items: { type: string }
 *           example: [brand-123, brand-456]
 *         priority: { type: integer, minimum: 1, maximum: 10, example: 2 }
 *         status: { type: string, enum: [Draft, Live, Hidden], example: Live }
 *     PreferenceBulkStatusRequest:
 *       type: object
 *       required: [preference_ids, status]
 *       properties:
 *         preference_ids:
 *           type: array
 *           minItems: 1
 *           items: { type: string, minLength: 1 }
 *           example: [preference-123, preference-456]
 *         status: { type: string, enum: [Draft, Live, Hidden], example: Live }
 *     PreferenceBulkUpdateResult:
 *       type: object
 *       description: Raw MongoDB updateMany result. Ids that don't match an existing, non-deleted preference are silently skipped (matchedCount can be less than the number of ids submitted); no per-id error is returned.
 *       properties:
 *         acknowledged: { type: boolean, example: true }
 *         matchedCount: { type: integer, example: 2 }
 *         modifiedCount: { type: integer, example: 2 }
 *         upsertedCount: { type: integer, example: 0 }
 *         upsertedId: { type: string, nullable: true, example: null }
 *     PreferenceErrorResponse:
 *       type: object
 *       properties:
 *         status: { type: integer, example: 400 }
 *         message: { type: string, example: Something Went Wrong }
 */

/**
 * @swagger
 * /v1/preferences:
 *   get:
 *     summary: List preferences (paginated, with category/brand details joined in)
 *     tags: [Preferences]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, minimum: 1, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
 *       - in: query
 *         name: query
 *         schema: { type: string }
 *         description: Case-insensitive substring match against the joined category_name OR any joined brand_names (not against category_id/brand_ids directly).
 *     responses:
 *       200:
 *         description: Preferences returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Fetched Successfully }
 *                 data: { $ref: '#/components/schemas/PreferencePaginatedList' }
 *       401:
 *         description: Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PreferenceErrorResponse' }
 *             example: { status: 401, message: Unauthorized }
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PreferenceErrorResponse' }
 *             example: { status: 500, message: Something Went Wrong }
 *   post:
 *     summary: Create a preference
 *     description: Fails with 409 if a non-deleted preference already exists for the category_id, 404 if the category doesn't exist, 400 if the category is a sub-category (has a parent_id) or if any brand_ids don't resolve to existing, non-deleted brands.
 *     tags: [Preferences]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/PreferenceCreateRequest' }
 *     responses:
 *       201:
 *         description: Preference created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 201 }
 *                 message: { type: string, example: Record Created Successfully }
 *                 data: { $ref: '#/components/schemas/PreferenceResponse' }
 *       400:
 *         description: Body validation failed, the category is a sub-category, or one or more brand_ids don't exist
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PreferenceErrorResponse' }
 *             examples:
 *               validation:
 *                 value: { status: 400, message: "Expected array, received string" }
 *               subCategory:
 *                 value: { status: 400, message: "A preference must reference a main category, not a sub-category" }
 *               invalidBrands:
 *                 value: { status: 400, message: "One or more brand_ids do not exist" }
 *       401:
 *         description: Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PreferenceErrorResponse' }
 *             example: { status: 401, message: Unauthorized }
 *       404:
 *         description: category_id does not reference an existing, non-deleted category
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PreferenceErrorResponse' }
 *             example: { status: 404, message: "Category not found" }
 *       409:
 *         description: A non-deleted preference already exists for this category_id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PreferenceErrorResponse' }
 *             example: { status: 409, message: Record Already Exists }
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PreferenceErrorResponse' }
 *             example: { status: 500, message: Something Went Wrong }
 *   patch:
 *     summary: Update a preference by preference_id
 *     description: Only supplied fields are changed. Does not re-check category/brand existence or the category-uniqueness rule that create enforces.
 *     tags: [Preferences]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: preference_id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/PreferenceUpdateRequest' }
 *     responses:
 *       200:
 *         description: Preference updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Updated Successfully }
 *                 data: { $ref: '#/components/schemas/PreferenceResponse' }
 *       400:
 *         description: Body validation failed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PreferenceErrorResponse' }
 *             example: { status: 400, message: "Number must be greater than or equal to 1" }
 *       401:
 *         description: Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PreferenceErrorResponse' }
 *             example: { status: 401, message: Unauthorized }
 *       404:
 *         description: No non-deleted preference matches preference_id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PreferenceErrorResponse' }
 *             example: { status: 404, message: Not Found }
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PreferenceErrorResponse' }
 *             example: { status: 500, message: Something Went Wrong }
 *   delete:
 *     summary: Soft-delete a preference by preference_id
 *     description: Sets is_deleted to true on the matching, currently non-deleted preference. There is no bulk/hard delete for preferences.
 *     tags: [Preferences]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: preference_id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Preference deleted (soft) successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Deleted Successfully }
 *                 data: { $ref: '#/components/schemas/PreferenceResponse' }
 *       401:
 *         description: Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PreferenceErrorResponse' }
 *             example: { status: 401, message: Unauthorized }
 *       404:
 *         description: No non-deleted preference matches preference_id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PreferenceErrorResponse' }
 *             example: { status: 404, message: Not Found }
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PreferenceErrorResponse' }
 *             example: { status: 500, message: Something Went Wrong }
 */

/**
 * @swagger
 * /v1/preferences/details:
 *   get:
 *     summary: Get a single preference by preference_id
 *     description: Returns the raw preference document (not the category/brand-joined list shape).
 *     tags: [Preferences]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: preference_id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Preference returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Fetched Successfully }
 *                 data: { $ref: '#/components/schemas/PreferenceResponse' }
 *       401:
 *         description: Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PreferenceErrorResponse' }
 *             example: { status: 401, message: Unauthorized }
 *       404:
 *         description: No non-deleted preference matches preference_id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PreferenceErrorResponse' }
 *             example: { status: 404, message: Not Found }
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PreferenceErrorResponse' }
 *             example: { status: 500, message: Something Went Wrong }
 */

/**
 * @swagger
 * /v1/preferences/status:
 *   patch:
 *     summary: Bulk update the status of multiple preferences
 *     description: Applies a single status to every preference_id supplied (only among non-deleted preferences). Ids with no matching non-deleted preference are skipped silently rather than causing a 404 — check matchedCount/modifiedCount in the response to detect that.
 *     tags: [Preferences]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/PreferenceBulkStatusRequest' }
 *     responses:
 *       200:
 *         description: Preference statuses updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Updated Successfully }
 *                 data: { $ref: '#/components/schemas/PreferenceBulkUpdateResult' }
 *       400:
 *         description: Body validation failed (empty/missing preference_ids, or status not one of Draft/Live/Hidden)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PreferenceErrorResponse' }
 *             example: { status: 400, message: "Array must contain at least 1 element(s)" }
 *       401:
 *         description: Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PreferenceErrorResponse' }
 *             example: { status: 401, message: Unauthorized }
 *       500:
 *         description: Unexpected server error
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PreferenceErrorResponse' }
 *             example: { status: 500, message: Something Went Wrong }
 */
