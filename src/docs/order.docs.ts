/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management (requires Bearer auth). Creating an order snapshots price/product name/sku from the current ProductVariant/Product, claims sku units and records stock via the inventory ledger, and optionally records a payment in the same call.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderLineItemInput:
 *       type: object
 *       required: [product_variant_id, quantity]
 *       properties:
 *         product_variant_id: { type: string }
 *         quantity: { type: integer, minimum: 1 }
 *     OrderPaymentInput:
 *       type: object
 *       description: Optional. Omit for an order placed with no payment recorded yet (e.g. COD awaiting collection). amount is never accepted here — a payment is always recorded for the order's own computed total_price.
 *       required: [payment_mode]
 *       properties:
 *         payment_mode:
 *           type: string
 *           enum: [COD, RAZORPAY]
 *         transaction_id: { type: string, minLength: 1 }
 *         status:
 *           type: string
 *           enum: [PENDING, SUCCESS, FAILED, REFUNDED]
 *           default: PENDING
 *           description: If SUCCESS and the order was PENDING, the order is immediately moved to CONFIRMED.
 *     OrderCreateRequest:
 *       type: object
 *       required: [user_id, address_id, products]
 *       properties:
 *         user_id: { type: string }
 *         address_id: { type: string, description: Must reference a non-deleted address belonging to user_id. }
 *         products:
 *           type: array
 *           minItems: 1
 *           items: { $ref: '#/components/schemas/OrderLineItemInput' }
 *         payment: { $ref: '#/components/schemas/OrderPaymentInput' }
 *     OrderLineItemData:
 *       type: object
 *       description: Snapshotted at order-creation time — later changes to the product/variant do not retroactively affect this line.
 *       properties:
 *         product_id: { type: string }
 *         product_variant_id: { type: string }
 *         sku:
 *           type: array
 *           items: { type: string }
 *           description: The exact sku_code units claimed for this line (length === quantity). Empty when the product is not inventory managed, or is an AFFILIATE product.
 *         product_name: { type: string }
 *         GST: { type: string, nullable: true, description: GST percentage snapshotted from Product.GST at order time. }
 *         variant_combination:
 *           type: array
 *           items: { type: string }
 *         quantity: { type: integer }
 *         price: { type: number, description: Unit price at time of order (ProductVariant.price). }
 *         discount_price: { type: number, nullable: true, description: Unit discounted price at time of order (ProductVariant.discount_price), if any. }
 *         line_total: { type: number, description: (discount_price ?? price) * quantity. }
 *         inventory_managed: { type: boolean }
 *     OrderPaymentSummary:
 *       type: object
 *       nullable: true
 *       description: null when the order has no linked payment yet.
 *       properties:
 *         payment_id: { type: string }
 *         order_id: { type: string }
 *         transaction_id: { type: string, nullable: true }
 *         payment_mode: { type: string, enum: [COD, RAZORPAY] }
 *         amount: { type: number }
 *         status: { type: string, enum: [PENDING, SUCCESS, FAILED, REFUNDED] }
 *     OrderResponse:
 *       type: object
 *       properties:
 *         order_id: { type: string }
 *         order_number: { type: string, description: "e.g. ORD-3F9A2C10" }
 *         user_id: { type: string }
 *         address_id: { type: string }
 *         products:
 *           type: array
 *           items: { $ref: '#/components/schemas/OrderLineItemData' }
 *         quantity: { type: integer, description: "Total units across every line (sum of products[].quantity)." }
 *         total_price: { type: number, description: "Payable amount after discount (sum of products[].line_total)." }
 *         tax_total: { type: number, description: "Sum across lines of (line_total * GST% / 100), snapshotted at order time." }
 *         discount_price: { type: number, description: Total amount saved via discounts across all lines — this is an aggregate, not a per-unit price. }
 *         status: { type: string, enum: [PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURNED] }
 *         payment_id: { type: string, nullable: true }
 *         payment: { $ref: '#/components/schemas/OrderPaymentSummary' }
 *         is_deleted: { type: boolean }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     OrderSkuUnit:
 *       type: object
 *       properties:
 *         sku: { type: string }
 *         is_deleted: { type: boolean, description: Whether this physical sku unit's product/variant has since been soft-deleted. }
 *     OrderListLineItem:
 *       type: object
 *       properties:
 *         product_id: { type: string }
 *         product_variant_id: { type: string }
 *         sku_units:
 *           type: array
 *           items: { $ref: '#/components/schemas/OrderSkuUnit' }
 *         GST: { type: string, nullable: true }
 *         product_name: { type: string }
 *         variant_combination:
 *           type: array
 *           items: { type: string }
 *         quantity: { type: integer }
 *         price: { type: number }
 *         discount_price: { type: number, nullable: true }
 *         inventory_managed: { type: boolean }
 *     OrderListItem:
 *       type: object
 *       description: Full per-order detail returned by the list endpoint (one row per order, enriched with customer, sku and payment detail).
 *       properties:
 *         order_id: { type: string }
 *         order_number: { type: string }
 *         user_id: { type: string }
 *         customer_name: { type: string, nullable: true, description: Resolved from the user's profile; null if no profile matched. }
 *         customer_email: { type: string, nullable: true, description: Resolved from the user account; null if no user matched. }
 *         customer_phone: { type: string, nullable: true, description: Resolved from the user's profile; null if no profile matched. }
 *         address_id: { type: string }
 *         products:
 *           type: array
 *           items: { $ref: '#/components/schemas/OrderListLineItem' }
 *         total_product: { type: integer, description: Number of distinct product lines on the order. }
 *         total_price: { type: number }
 *         tax_total: { type: number }
 *         discount_price: { type: number }
 *         status: { type: string, enum: [PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURNED] }
 *         payment_id: { type: string, nullable: true }
 *         payment: { $ref: '#/components/schemas/OrderPaymentSummary' }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     OrderListResponse:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items: { $ref: '#/components/schemas/OrderListItem' }
 *         total: { type: integer }
 *         page: { type: integer }
 *         limit: { type: integer }
 *         totalPages: { type: integer }
 *     OrderBulkIdsRequest:
 *       type: object
 *       required: [ids]
 *       properties:
 *         ids:
 *           type: array
 *           items: { type: string, minLength: 1 }
 *           minItems: 1
 *           example: [a1b2c3d4e5f6, f6e5d4c3b2a1]
 *     OrderBulkStatusRequest:
 *       type: object
 *       required: [ids, status]
 *       properties:
 *         ids:
 *           type: array
 *           items: { type: string, minLength: 1 }
 *           minItems: 1
 *           example: [a1b2c3d4e5f6, f6e5d4c3b2a1]
 *         status: { type: string, enum: [PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURNED] }
 *     OrderBulkStatusResponse:
 *       type: object
 *       properties:
 *         updated: { type: integer, description: Count of ids that were actually transitioned. }
 *         total: { type: integer, description: Count of ids submitted. }
 *     OrderBulkDeleteResponse:
 *       type: object
 *       properties:
 *         deleted: { type: integer }
 */

/**
 * IMPLEMENTATION NOTE (not part of the OpenAPI spec — kept here so it isn't lost):
 * order.routes.ts registers BOTH `router.post("/", requireAuth, validateBody(orderCreateSchema), createOrder)`
 * and, further down, `router.post("/", requireAuth, deleteOrder)` for the exact same method+path. Express
 * dispatches to the first matching route only, so the second registration (the soft-delete handler,
 * orderService.deleteOrder) is dead code and is never reached in the running app — any POST /v1/orders call
 * is handled by createOrder and will fail orderCreateSchema validation if it doesn't look like a create
 * payload. (Prior to the most recent revision this route was `router.delete("/", ...)`, which is how the
 * previous version of these docs described it; that DELETE route no longer exists.) Only the reachable
 * operation is documented below. If routing is fixed to restore a working soft-delete, it takes
 * OrderBulkIdsRequest and returns OrderBulkDeleteResponse (200), 404 when none of the ids match a
 * non-deleted order, matching the pattern already used by hard-delete below.
 */

/**
 * @swagger
 * /v1/orders:
 *   get:
 *     summary: List orders (paginated), optionally filtered by user, status, or a free-text search
 *     tags: [Orders]
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
 *         name: user_id
 *         schema: { type: string }
 *         description: Exact match filter.
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURNED] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Case-insensitive partial match against order_id, user_id, the customer's full_name, or the linked payment's transaction_id.
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
 *                 data: { $ref: '#/components/schemas/OrderListResponse' }
 *       401: { description: Unauthorized }
 *   post:
 *     summary: Create an order — snapshots product/variant data, claims sku units and records outbound stock, and optionally records its payment in the same call
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/OrderCreateRequest' }
 *     responses:
 *       201:
 *         description: Created. If payment.status is SUCCESS the order comes back already CONFIRMED. The order still stands even if payment recording itself fails (e.g. a duplicate transaction_id) — it's simply left with payment null / payment_id null.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 201 }
 *                 message: { type: string, example: Record Created Successfully }
 *                 data: { $ref: '#/components/schemas/OrderResponse' }
 *       400:
 *         description: Body failed validation, address_id does not resolve to a non-deleted address for user_id, product_variant_id does not resolve to an active variant, or the variant's product could not be found/is deleted.
 *       401: { description: Unauthorized }
 *       409: { description: Not enough available (unsold) sku units for a variant, or insufficient stock_on_hand on the variant, for one or more lines. }
 *       500: { description: Something Went Wrong }
 */

/**
 * @swagger
 * /v1/orders/details:
 *   get:
 *     summary: Get a single non-deleted order by ?order_id=, including its linked payment
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: order_id
 *         required: true
 *         schema: { type: string }
 *         description: Not enforced as required by the route itself — omitting it currently matches the first non-deleted order found.
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
 *                 data: { $ref: '#/components/schemas/OrderResponse' }
 *       401: { description: Unauthorized }
 *       404: { description: Not Found }
 *       500: { description: Something Went Wrong }
 */

/**
 * @swagger
 * /v1/orders/status:
 *   patch:
 *     summary: Bulk-transition the status of orders by id
 *     description: >
 *       Transitioning an id to CANCELLED restocks every inventory-managed line of that order (releases its
 *       claimed sku units and records an inbound CUSTOMER_RETURN movement) before flipping its status.
 *       An order already CANCELLED or RETURNED, or an id that doesn't resolve to a non-deleted order, is
 *       silently skipped rather than failing the request — the response always reports 200 with counts of
 *       how many of the submitted ids were actually transitioned vs. submitted.
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/OrderBulkStatusRequest' }
 *     responses:
 *       200:
 *         description: OK — updated may be less than total when some ids were not found or are already CANCELLED/RETURNED.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Updated Successfully }
 *                 data: { $ref: '#/components/schemas/OrderBulkStatusResponse' }
 *       400: { description: Body failed validation (empty ids, missing/invalid status). }
 *       401: { description: Unauthorized }
 *       500: { description: Something Went Wrong }
 */

/**
 * @swagger
 * /v1/orders/hard-delete:
 *   post:
 *     summary: Permanently delete orders by id (bulk, irreversible — bypasses is_deleted entirely)
 *     description: Unlike the soft-delete path, this does not check that the ids exist first; deleting ids that don't match any order still responds 200 with deleted:0.
 *     tags: [Orders]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/OrderBulkIdsRequest' }
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
 *                 data: { $ref: '#/components/schemas/OrderBulkDeleteResponse' }
 *       400: { description: Body failed validation (empty ids). }
 *       401: { description: Unauthorized }
 *       500: { description: Something Went Wrong }
 */
