/**
 * @swagger
 * tags:
 *   name: Varients
 *   description: >
 *     Varients are top-level attribute-type entities (e.g. "Color", "Size")
 *     with a fixed set of possible values (varient_values). They are NOT a
 *     product's own SKU-level variants (those live in the product module) -
 *     a Varient is referenced by a Product's `varient_ids` array purely to
 *     label that product's variant combinations (e.g. showing "Color: Blue"
 *     on a SKU). All routes require Bearer auth.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     VarientCreateRequest:
 *       type: object
 *       required: [varient_name, varient_values]
 *       properties:
 *         varient_name:
 *           type: string
 *           minLength: 1
 *           example: Color
 *         varient_values:
 *           type: array
 *           items: { type: string, minLength: 1 }
 *           minItems: 1
 *           example: [Blue, Black, White]
 *         status:
 *           type: string
 *           enum: [Draft, Live, Hidden]
 *           description: Defaults to "Live" when omitted.
 *     VarientUpdateRequest:
 *       type: object
 *       description: All fields are optional; only the supplied fields are changed.
 *       properties:
 *         varient_name:
 *           type: string
 *           minLength: 1
 *           example: Color
 *         varient_values:
 *           type: array
 *           items: { type: string, minLength: 1 }
 *           minItems: 1
 *           example: [Blue, Black, White]
 *         status:
 *           type: string
 *           enum: [Draft, Live, Hidden]
 *     VarientBulkIdsRequest:
 *       type: object
 *       required: [ids]
 *       properties:
 *         ids:
 *           type: array
 *           items: { type: string, minLength: 1 }
 *           minItems: 1
 *           example: [a1b2c3d4e5f6, f6e5d4c3b2a1]
 *     VarientBulkStatusRequest:
 *       type: object
 *       required: [ids, status]
 *       properties:
 *         ids:
 *           type: array
 *           items: { type: string, minLength: 1 }
 *           minItems: 1
 *           example: [a1b2c3d4e5f6, f6e5d4c3b2a1]
 *         status:
 *           type: string
 *           enum: [Draft, Live, Hidden]
 *     VarientResponse:
 *       type: object
 *       description: The stored Varient document, as returned by create/update/details.
 *       properties:
 *         _id: { type: string, example: 66f1c2b1a1b2c3d4e5f6a7b8 }
 *         varient_id: { type: string, example: a1b2c3d4e5f6 }
 *         varient_name: { type: string, example: Color }
 *         varient_values:
 *           type: array
 *           items: { type: string }
 *           example: [Blue, Black, White]
 *         status: { type: string, enum: [Draft, Live, Hidden], example: Live }
 *         is_deleted: { type: boolean, example: false }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     VarientPaginatedResponse:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items: { $ref: '#/components/schemas/VarientResponse' }
 *         total: { type: integer, example: 42 }
 *         page: { type: integer, example: 1 }
 *         limit: { type: integer, example: 20 }
 *         totalPages: { type: integer, example: 3 }
 *     VarientHardDeleteResult:
 *       type: object
 *       properties:
 *         deleted:
 *           type: integer
 *           example: 2
 *           description: Count of documents permanently removed (deleteMany.deletedCount). Can be 0 if none of the ids matched - this endpoint does not 404.
 *     VarientStatusUpdateResult:
 *       type: object
 *       properties:
 *         updated:
 *           type: integer
 *           example: 2
 *           description: Count of non-deleted documents whose status was changed (updateMany.modifiedCount). Can be 0 if none of the ids matched - this endpoint does not 404.
 *     VarientBulkDeleteResponse:
 *       type: object
 *       description: What deleteVarient (varient.services.ts) returns - currently unreachable over HTTP, see the implementation note above /v1/varients.
 *       properties:
 *         deleted:
 *           type: integer
 *           example: 2
 *           description: Count of non-deleted documents soft-deleted (updateMany.modifiedCount).
 *     VarientErrorResponse:
 *       type: object
 *       properties:
 *         status: { type: integer, example: 400 }
 *         message: { type: string, example: "Validation error message" }
 */

/**
 * @swagger
 * /v1/varients:
 *   get:
 *     summary: List varients (paginated)
 *     description: >
 *       Returns non-deleted varients sorted by newest first. `query` matches
 *       varient_name by case-insensitive prefix OR varient_values by
 *       case-insensitive substring; `status` matches the status field
 *       case-insensitively (exact, not prefix).
 *     tags: [Varients]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *         description: Capped at 100.
 *       - in: query
 *         name: query
 *         schema: { type: string }
 *         description: Search by varient_name prefix or varient_values substring.
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Draft, Live, Hidden] }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Fetched Successfully }
 *                 data: { $ref: '#/components/schemas/VarientPaginatedResponse' }
 *       401:
 *         description: Unauthorized - missing/invalid bearer token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/VarientErrorResponse' }
 *       500:
 *         description: Something went wrong
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/VarientErrorResponse' }
 *   post:
 *     summary: Create a varient
 *     description: >
 *       Rejects with 409 if a non-deleted varient with the same varient_name
 *       already exists (varient_name is also unique at the schema/index
 *       level).
 *     tags: [Varients]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/VarientCreateRequest' }
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 201 }
 *                 message: { type: string, example: Record Created Successfully }
 *                 data: { $ref: '#/components/schemas/VarientResponse' }
 *       400:
 *         description: Validation error (from Zod, e.g. empty varient_name or empty varient_values)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/VarientErrorResponse' }
 *       401:
 *         description: Unauthorized - missing/invalid bearer token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/VarientErrorResponse' }
 *       409:
 *         description: A non-deleted varient with this varient_name already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 409 }
 *                 message: { type: string, example: Record Already Exists }
 *       500:
 *         description: Something went wrong
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/VarientErrorResponse' }
 *   patch:
 *     summary: Update a varient by ?varient_id=
 *     description: Only updates the varient if it exists and is not soft-deleted.
 *     tags: [Varients]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: varient_id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/VarientUpdateRequest' }
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Updated Successfully }
 *                 data: { $ref: '#/components/schemas/VarientResponse' }
 *       400:
 *         description: Validation error (from Zod)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/VarientErrorResponse' }
 *       401:
 *         description: Unauthorized - missing/invalid bearer token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/VarientErrorResponse' }
 *       404:
 *         description: No non-deleted varient with this varient_id
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 404 }
 *                 message: { type: string, example: Not Found }
 *       500:
 *         description: Something went wrong
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/VarientErrorResponse' }
 */

/**
 * @swagger
 * /v1/varients/details:
 *   get:
 *     summary: Get a single varient by ?varient_id=
 *     tags: [Varients]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: varient_id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Fetched Successfully }
 *                 data: { $ref: '#/components/schemas/VarientResponse' }
 *       401:
 *         description: Unauthorized - missing/invalid bearer token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/VarientErrorResponse' }
 *       404:
 *         description: No non-deleted varient with this varient_id
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 404 }
 *                 message: { type: string, example: Not Found }
 *       500:
 *         description: Something went wrong
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/VarientErrorResponse' }
 */

/**
 * @swagger
 * /v1/varients/soft-delete:
 *   post:
 *     summary: Soft-delete varients by id (bulk, reversible)
 *     description: >
 *       Sets is_deleted to true on every matching, non-deleted varient. 409
 *       ("Brand IDs are required" — copy-pasted message text) if ids is empty
 *       after body validation; 404 when none of the given ids match a
 *       non-deleted varient. (Previously this handler was registered on
 *       `POST /v1/varients`, shadowed by createVarient on the same
 *       method+path and therefore unreachable; it now has its own path.)
 *     tags: [Varients]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/VarientBulkIdsRequest' }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Deleted Successfully }
 *                 data: { $ref: '#/components/schemas/VarientBulkDeleteResponse' }
 *       400:
 *         description: Validation error (ids missing or empty)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/VarientErrorResponse' }
 *       401:
 *         description: Unauthorized - missing/invalid bearer token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/VarientErrorResponse' }
 *       404:
 *         description: None of the given ids matched a non-deleted varient
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/VarientErrorResponse' }
 *       409:
 *         description: ids array was empty (passes Zod's minItems but reached the service check — in practice unreachable once validateBody(varientBulkIdsSchema) is applied)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/VarientErrorResponse' }
 *       500:
 *         description: Something went wrong
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/VarientErrorResponse' }
 */

/**
 * @swagger
 * /v1/varients/hard-delete:
 *   post:
 *     summary: Permanently delete varients by id (bulk, irreversible)
 *     description: >
 *       Hard-deletes documents regardless of their is_deleted flag. Does not
 *       validate that the referenced varient_ids are unused by any Product
 *       first, and does not 404 - deleted:0 is returned as a 200 when no ids
 *       matched.
 *     tags: [Varients]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/VarientBulkIdsRequest' }
 *     responses:
 *       200:
 *         description: Deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Deleted Successfully }
 *                 data: { $ref: '#/components/schemas/VarientHardDeleteResult' }
 *       400:
 *         description: Validation error (ids missing or empty)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/VarientErrorResponse' }
 *       401:
 *         description: Unauthorized - missing/invalid bearer token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/VarientErrorResponse' }
 *       500:
 *         description: Something went wrong
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/VarientErrorResponse' }
 */

/**
 * @swagger
 * /v1/varients/status:
 *   patch:
 *     summary: Bulk update the status of varients by id
 *     description: >
 *       Only affects non-deleted documents. Does not 404 - updated:0 is
 *       returned as a 200 when no ids matched a non-deleted document.
 *     tags: [Varients]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/VarientBulkStatusRequest' }
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Updated Successfully }
 *                 data: { $ref: '#/components/schemas/VarientStatusUpdateResult' }
 *       400:
 *         description: Validation error (ids missing/empty, or status not one of Draft/Live/Hidden)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/VarientErrorResponse' }
 *       401:
 *         description: Unauthorized - missing/invalid bearer token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/VarientErrorResponse' }
 *       500:
 *         description: Something went wrong
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/VarientErrorResponse' }
 */
