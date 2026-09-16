/**
 * @swagger
 * tags:
 *   name: Refunds
 *   description: >
 *     Refund lifecycle management for orders (all routes require Bearer auth).
 *     Transitioning a refund's status to PROCESSED restocks the inventory-managed
 *     lines of the linked order, sets that order's status to RETURNED, and — if the
 *     order has a linked payment — sets that payment's status to REFUNDED.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RefundResponse:
 *       type: object
 *       description: Shape of a refund document as persisted (returned as-is by create/read, and by a status update that doesn't reach PROCESSED).
 *       properties:
 *         refund_id: { type: string, example: a1b2c3d4e5f6 }
 *         user_id: { type: string }
 *         order_id: { type: string }
 *         shipment_id: { type: string, nullable: true, description: "Null when the refund isn't tied to a specific shipment (e.g. order cancelled before shipping)." }
 *         refund_status: { type: string, enum: [REQUESTED, APPROVED, REJECTED, PROCESSED], example: REQUESTED }
 *         refund_remark: { type: string, nullable: true }
 *         is_deleted: { type: boolean, example: false }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     RefundCreateRequest:
 *       type: object
 *       required: [user_id, order_id]
 *       properties:
 *         user_id: { type: string, description: "Must own an existing, non-deleted order matching order_id." }
 *         order_id: { type: string }
 *         shipment_id: { type: string, description: "Optional. If given, must belong to order_id and not be soft-deleted." }
 *         refund_remark: { type: string }
 *     RefundBulkIdsRequest:
 *       type: object
 *       required: [ids]
 *       properties:
 *         ids:
 *           type: array
 *           items: { type: string, minLength: 1 }
 *           minItems: 1
 *           example: [a1b2c3d4e5f6, f6e5d4c3b2a1]
 *     RefundBulkStatusRequest:
 *       type: object
 *       required: [ids, status]
 *       properties:
 *         ids:
 *           type: array
 *           items: { type: string, minLength: 1 }
 *           minItems: 1
 *           example: [a1b2c3d4e5f6, f6e5d4c3b2a1]
 *         status: { type: string, enum: [REQUESTED, APPROVED, REJECTED, PROCESSED] }
 *     RefundBulkStatusResult:
 *       type: object
 *       description: >
 *         Always returned with HTTP 200, even when some ids fail. A refund is skipped
 *         (not counted in `updated`) when it doesn't exist, is already PROCESSED, or
 *         (only when transitioning to PROCESSED) its linked order can't be found — none
 *         of these per-id failures surface as an HTTP error for the bulk call.
 *       properties:
 *         updated: { type: integer, example: 2, description: "Count of ids that were successfully transitioned." }
 *         total: { type: integer, example: 2, description: "Count of ids submitted." }
 *     RefundListItem:
 *       type: object
 *       description: Denormalized row shape returned by GET /v1/refunds (built via aggregation $lookup against orders and user profiles) — distinct from RefundResponse. One row per refund (not per order line).
 *       properties:
 *         refund_id: { type: string }
 *         product_id: { type: string, nullable: true, description: "product_id of the order's first product line; null if the order has no lines." }
 *         item_code: { type: string, nullable: true, description: "First sku code of that first product line." }
 *         customer_name: { type: string, nullable: true, description: "From the matching UserProfile's full_name." }
 *         customer_id: { type: string, description: "The refund's user_id." }
 *         reason: { type: string, nullable: true, description: "The refund's refund_remark." }
 *         order_date: { type: string, format: date-time, nullable: true, description: "The linked order's createdAt." }
 *         refund_processing_date: { type: string, format: date-time, description: "The refund's updatedAt." }
 *         status: { type: string, enum: [REQUESTED, APPROVED, REJECTED, PROCESSED], description: "The refund's refund_status." }
 *     RefundPaginatedResult:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items: { $ref: '#/components/schemas/RefundListItem' }
 *         total: { type: integer, example: 1 }
 *         page: { type: integer, example: 1 }
 *         limit: { type: integer, example: 20 }
 *         totalPages: { type: integer, example: 1 }
 *     RefundDeleteResult:
 *       type: object
 *       properties:
 *         deleted: { type: integer, example: 1, description: "Number of refund documents affected (soft-flagged or, for hard-delete, actually removed)." }
 */

/**
 * @swagger
 * /v1/refunds:
 *   get:
 *     summary: List refunds (paginated, with denormalized order/profile fields)
 *     description: >
 *       Supports free-text search across refund_id, user_id, the matched profile's
 *       full_name, and the matched order's product_id/sku. There is no order_id or
 *       user_id filter param — only `search` and `status`.
 *     tags: [Refunds]
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
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [REQUESTED, APPROVED, REJECTED, PROCESSED] }
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
 *                 data: { $ref: '#/components/schemas/RefundPaginatedResult' }
 *       401:
 *         description: Missing/invalid bearer token, or the token's role isn't admin.
 *       500:
 *         description: Unexpected server/aggregation error.
 *   post:
 *     summary: Request a refund for an order
 *     description: >
 *       order_id must belong to an existing, non-deleted order owned by user_id. If
 *       shipment_id is supplied it must belong to that same order and not be soft-deleted.
 *       The created refund always starts as refund_status REQUESTED regardless of any
 *       other field in the request body.
 *     tags: [Refunds]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RefundCreateRequest' }
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
 *                 data: { $ref: '#/components/schemas/RefundResponse' }
 *       400:
 *         description: >
 *           Body failed validation (missing user_id/order_id, or empty strings — message
 *           is the joined Zod error messages), or "Order not found for this user", or
 *           "Shipment not found for this order".
 *       401:
 *         description: Missing/invalid bearer token, or the token's role isn't admin.
 *       500:
 *         description: Unexpected server error.
 */

/**
 * @swagger
 * /v1/refunds/details:
 *   get:
 *     summary: Get a single non-deleted refund by ?refund_id=
 *     tags: [Refunds]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: refund_id
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
 *                 data: { $ref: '#/components/schemas/RefundResponse' }
 *       401:
 *         description: Missing/invalid bearer token, or the token's role isn't admin.
 *       404:
 *         description: No non-deleted refund matches refund_id (message "Not Found").
 *       500:
 *         description: Unexpected server error.
 */

/**
 * @swagger
 * /v1/refunds/status:
 *   patch:
 *     summary: Bulk transition the status of refunds by id
 *     description: >
 *       Applies the requested status to every id independently. Transitioning an id to
 *       PROCESSED: looks up its linked order, restocks the inventory-managed order
 *       lines, sets the order's status to RETURNED, and — if the order has a
 *       payment_id — sets that payment's status to REFUNDED, then marks the refund
 *       PROCESSED. Any id whose refund is already PROCESSED, doesn't exist, or (only on
 *       the PROCESSED path) has no resolvable linked order is silently skipped and
 *       excluded from `updated` — this always responds 200, never a per-id 400/404.
 *     tags: [Refunds]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RefundBulkStatusRequest' }
 *     responses:
 *       200:
 *         description: OK (always returned once the request body validates, regardless of how many ids succeeded).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Updated Successfully }
 *                 data: { $ref: '#/components/schemas/RefundBulkStatusResult' }
 *       400:
 *         description: Body failed validation — missing/empty ids, missing status, or status not one of REQUESTED/APPROVED/REJECTED/PROCESSED (message is the joined Zod error messages).
 *       401:
 *         description: Missing/invalid bearer token, or the token's role isn't admin.
 *       500:
 *         description: Unexpected server error (e.g. a lookup failure not caught per-id).
 */

/**
 * @swagger
 * /v1/refunds/soft-delete:
 *   post:
 *     summary: Soft-delete refunds by id (bulk, reversible)
 *     description: >
 *       Sets is_deleted to true on every matching, non-deleted refund. 404 when
 *       none of the given ids match a non-deleted refund, and 400 with "Refund
 *       IDs are required" if ids is empty after body validation. (Previously
 *       this handler was registered on `POST /v1/refunds`, shadowed by
 *       createRefund on the same method+path and therefore unreachable; it
 *       now has its own path.)
 *     tags: [Refunds]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RefundBulkIdsRequest' }
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
 *                 data: { $ref: '#/components/schemas/RefundDeleteResult' }
 *       400:
 *         description: Body failed validation — missing/empty ids array (message is the joined Zod error messages).
 *       401:
 *         description: Missing/invalid bearer token, or the token's role isn't admin.
 *       404:
 *         description: None of the given ids matched a non-deleted refund.
 *       500:
 *         description: Unexpected server error.
 */

/**
 * @swagger
 * /v1/refunds/hard-delete:
 *   post:
 *     summary: Permanently delete refunds by id (bulk, irreversible)
 *     description: >
 *       Removes matching Refund documents outright via deleteMany — unlike the
 *       soft-delete path above, this ignores is_deleted entirely, so it can hard-delete
 *       refunds regardless of prior soft-delete state. Always responds 200 with the count
 *       actually removed, including 0 when none of the ids matched (no 404 branch).
 *     tags: [Refunds]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/RefundBulkIdsRequest' }
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
 *                 data: { $ref: '#/components/schemas/RefundDeleteResult' }
 *       400:
 *         description: Body failed validation — missing/empty ids array (message is the joined Zod error messages).
 *       401:
 *         description: Missing/invalid bearer token, or the token's role isn't admin.
 *       500:
 *         description: Unexpected server error.
 */
