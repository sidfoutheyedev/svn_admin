/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Recording, listing, and managing payments raised against orders; a payment marked SUCCESS auto-confirms its still-PENDING linked order.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentResponse:
 *       type: object
 *       properties:
 *         _id: { type: string }
 *         payment_id: { type: string, example: "a1b2c3d4e5f6" }
 *         order_id: { type: string }
 *         transaction_id: { type: string, nullable: true }
 *         payment_mode: { type: string, enum: [COD, RAZORPAY] }
 *         amount: { type: number, example: 1499.5 }
 *         status: { type: string, enum: [PENDING, SUCCESS, FAILED, REFUNDED] }
 *         is_deleted: { type: boolean }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     PaymentCreateRequest:
 *       type: object
 *       required: [order_id, amount, payment_mode]
 *       properties:
 *         order_id: { type: string }
 *         amount: { type: number, minimum: 0 }
 *         payment_mode: { type: string, enum: [COD, RAZORPAY] }
 *         transaction_id: { type: string, description: "Optional. Must be unique across payments when provided." }
 *         status: { type: string, enum: [PENDING, SUCCESS, FAILED, REFUNDED], description: "Defaults to PENDING when omitted." }
 *     PaymentBulkStatusRequest:
 *       type: object
 *       required: [ids, status]
 *       properties:
 *         ids:
 *           type: array
 *           items: { type: string }
 *           minItems: 1
 *           description: "List of payment_id values."
 *           example: ["a1b2c3d4e5f6", "f6e5d4c3b2a1"]
 *         status: { type: string, enum: [PENDING, SUCCESS, FAILED, REFUNDED] }
 *     PaymentBulkIdsRequest:
 *       type: object
 *       required: [ids]
 *       properties:
 *         ids:
 *           type: array
 *           items: { type: string }
 *           minItems: 1
 *           description: "List of payment_id values."
 *           example: ["a1b2c3d4e5f6", "f6e5d4c3b2a1"]
 *     PaymentBulkDeleteResponse:
 *       type: object
 *       properties:
 *         deleted: { type: integer, description: "modifiedCount from the bulk soft-delete update." }
 *     PaymentErrorResponse:
 *       type: object
 *       properties:
 *         status: { type: integer, example: 400 }
 *         message: { type: string, example: "Order not found" }
 */

/**
 * @swagger
 * /v1/payments:
 *   post:
 *     summary: Record a payment against an order
 *     description: >
 *       Validates that the referenced order exists (and is not soft-deleted) before creating
 *       the payment. Generates a random hex payment_id, sets order.payment_id to the new
 *       payment, and — if status resolves to SUCCESS and the order is still PENDING — moves
 *       the order to CONFIRMED.
 *     tags: [Payments]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentCreateRequest'
 *     responses:
 *       201:
 *         description: Payment created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 201 }
 *                 message: { type: string, example: "Record Created Successfully" }
 *                 data: { $ref: '#/components/schemas/PaymentResponse' }
 *       400:
 *         description: Validation error (bad payload) or the referenced order does not exist / is deleted
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaymentErrorResponse' }
 *             examples:
 *               validation:
 *                 value: { status: 400, message: "Amount must be a nonnegative number" }
 *               orderNotFound:
 *                 value: { status: 400, message: "Order not found" }
 *       401:
 *         description: Unauthorized (missing/invalid bearer token)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaymentErrorResponse' }
 *       409:
 *         description: Duplicate transaction_id (unique constraint)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaymentErrorResponse' }
 *             examples:
 *               duplicate:
 *                 value: { status: 409, message: "Record Already Exists" }
 *       500:
 *         description: Something went wrong
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaymentErrorResponse' }
 *   get:
 *     summary: List payments (paginated, filterable)
 *     tags: [Payments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *         description: "Clamped between 1 and 100."
 *       - in: query
 *         name: order_id
 *         schema: { type: string }
 *         description: "Filter to payments for a single order."
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, SUCCESS, FAILED, REFUNDED] }
 *       - in: query
 *         name: query
 *         schema: { type: string }
 *         description: "Case-insensitive substring match against payment_id, order_id, or transaction_id."
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: "Record Fetched Successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/PaymentResponse' }
 *                     total: { type: integer, example: 42 }
 *                     page: { type: integer, example: 1 }
 *                     limit: { type: integer, example: 20 }
 *                     totalPages: { type: integer, example: 3 }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaymentErrorResponse' }
 *       500:
 *         description: Something went wrong
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaymentErrorResponse' }
 */

/**
 * @swagger
 * /v1/payments/details:
 *   get:
 *     summary: Get a single payment by payment_id
 *     tags: [Payments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: payment_id
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
 *                 message: { type: string, example: "Record Fetched Successfully" }
 *                 data: { $ref: '#/components/schemas/PaymentResponse' }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaymentErrorResponse' }
 *       404:
 *         description: No non-deleted payment found for the given payment_id
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaymentErrorResponse' }
 *             examples:
 *               notFound:
 *                 value: { status: 404, message: "Not Found" }
 *       500:
 *         description: Something went wrong
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaymentErrorResponse' }
 */

/**
 * @swagger
 * /v1/payments/status:
 *   patch:
 *     summary: Bulk update payment status by id
 *     description: >
 *       Sets status on every matching, non-deleted payment_id (no not-found check per id —
 *       ids that don't match anything are silently ignored). When status is SUCCESS, also
 *       moves every linked order that is still PENDING to CONFIRMED (matched by order_id
 *       across ALL supplied payment ids, regardless of their is_deleted state).
 *     tags: [Payments]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentBulkStatusRequest'
 *     responses:
 *       200:
 *         description: Update applied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: "Record Updated Successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     updated: { type: integer, example: 2, description: "modifiedCount from the bulk update." }
 *       400:
 *         description: Validation error (empty/missing ids, or invalid status)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaymentErrorResponse' }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaymentErrorResponse' }
 *       500:
 *         description: Something went wrong
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaymentErrorResponse' }
 */

/**
 * @swagger
 * /v1/payments/soft-delete:
 *   post:
 *     summary: Soft-delete payments by id (bulk, reversible)
 *     description: >
 *       Sets is_deleted to true on every matching, non-deleted payment. 400
 *       with "Payment_id is required" if ids is empty after body validation.
 *       (Previously this handler was registered on `POST /v1/payments`,
 *       shadowed by createPayment on the same method+path and therefore
 *       unreachable; it now has its own path.)
 *     tags: [Payments]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentBulkIdsRequest'
 *     responses:
 *       200:
 *         description: Payment(s) soft-deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: "Record Deleted Successfully" }
 *                 data: { $ref: '#/components/schemas/PaymentBulkDeleteResponse' }
 *       400:
 *         description: Validation error (empty/missing ids), or "Payment_id is required"
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaymentErrorResponse' }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaymentErrorResponse' }
 *       404:
 *         description: No non-deleted payment matched any of the given ids
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaymentErrorResponse' }
 *       500:
 *         description: Something went wrong
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaymentErrorResponse' }
 */

/**
 * @swagger
 * /v1/payments/hard-delete:
 *   post:
 *     summary: Permanently delete payments by id (bulk, irreversible)
 *     description: >
 *       Hard-deletes every payment whose payment_id is in the supplied ids array (regardless
 *       of is_deleted state). This is a permanent removal, distinct from the bulk soft-delete
 *       handler above, and does not touch the linked orders.
 *     tags: [Payments]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentBulkIdsRequest'
 *     responses:
 *       200:
 *         description: Deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: "Record Deleted Successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     deleted: { type: integer, example: 2, description: "deletedCount from the bulk delete." }
 *       400:
 *         description: Validation error (empty/missing ids)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaymentErrorResponse' }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaymentErrorResponse' }
 *       500:
 *         description: Something went wrong
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/PaymentErrorResponse' }
 */
