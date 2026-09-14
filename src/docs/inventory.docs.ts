/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Append-only stock ledger keyed by product_variant_id, with no delete/soft-delete endpoint of any kind — every row ever written stays forever. INBOUND/OUTBOUND movement rows are never created directly over HTTP; they are written internally by the product module (opening stock on create/edit) and the order module (SALE on checkout, CUSTOMER_RETURN on refund) as a side effect of those operations. These three endpoints are read-only views into the resulting stock_on_hand and ledger history.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     InventoryMovement:
 *       type: object
 *       description: One immutable ledger row. Never updated or deleted after creation.
 *       properties:
 *         _id: { type: string }
 *         product_variant_id: { type: string }
 *         type: { type: string, enum: [INBOUND, OUTBOUND] }
 *         reason: { type: string, enum: ["STOCKS ADJUSTED", SALE, CUSTOMER_RETURN, PURCHASE] }
 *         quantity: { type: integer, minimum: 1, example: 7 }
 *         balance_after: { type: integer, minimum: 0, description: stock_on_hand immediately after this movement was applied }
 *         reference_id: { type: string, nullable: true }
 *         reference_type: { type: string, enum: [ORDER, RETURN, PURCHASE, MANUAL], nullable: true }
 *         idempotency_key: { type: string, description: Caller-supplied dedupe key with a unique index — a retried/redelivered write can never double-apply a movement }
 *         performed_by: { type: string, nullable: true }
 *         note: { type: string, nullable: true }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     InventoryListItem:
 *       type: object
 *       description: One row per active product variant, joined with its parent product and category/sub-category names, plus lifetime sold/revenue figures derived from the ledger and orders.
 *       properties:
 *         product_variant_id: { type: string }
 *         product_id: { type: string }
 *         product_name: { type: string }
 *         variant_combination: { type: array, items: { type: string } }
 *         stock_on_hand: { type: integer, description: Current stock remaining for this variant }
 *         category_name: { type: string, nullable: true }
 *         category_id: { type: string, nullable: true }
 *         sub_category_name: { type: string, nullable: true }
 *         sub_category_id: { type: string, nullable: true }
 *         sold_stock: { type: integer, description: Lifetime quantity sold — sum of OUTBOUND/SALE movement quantities for this variant. 0 when never sold. }
 *         total_stock: { type: integer, description: stock_on_hand + sold_stock, i.e. the total quantity ever stocked for this variant. }
 *         total_revenue: { type: number, description: Lifetime revenue — sum of order line_total across all orders containing this variant. 0 when never sold. }
 *     InventoryListResponse:
 *       type: object
 *       properties:
 *         items: { type: array, items: { $ref: '#/components/schemas/InventoryListItem' } }
 *         total: { type: integer }
 *         page: { type: integer }
 *         limit: { type: integer }
 *         totalPages: { type: integer }
 *     InventoryStockResponse:
 *       type: object
 *       properties:
 *         product_variant_id: { type: string }
 *         stock_on_hand: { type: integer }
 *     InventoryMovementsResponse:
 *       type: object
 *       properties:
 *         product_variant_id: { type: string }
 *         product_id: { type: string }
 *         stock_on_hand: { type: integer, description: Variant's current stock, not filtered/aged by the pagination window below. }
 *         movements:
 *           type: object
 *           properties:
 *             items: { type: array, items: { $ref: '#/components/schemas/InventoryMovement' } }
 *             total: { type: integer }
 *             page: { type: integer }
 *             limit: { type: integer }
 *             totalPages: { type: integer }
 */

/**
 * @swagger
 * /v1/inventory:
 *   get:
 *     summary: List one row per active variant across every product, with current stock plus lifetime sold/revenue figures
 *     description: Only variants with is_active true are included. Supports a case-insensitive substring search across the parent product's name/id and category/sub-category names, and an exact (case-insensitive) filter on the parent product's status. Sorted by the variant's createdAt, newest first.
 *     tags: [Inventory]
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
 *         description: Case-insensitive substring match against product.product_name, product.product_id, category name, or sub-category name.
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Live, Draft, Hidden] }
 *         description: Exact (case-insensitive) match against the parent product's status.
 *     responses:
 *       200:
 *         description: Record Fetched Successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Fetched Successfully }
 *                 data: { $ref: '#/components/schemas/InventoryListResponse' }
 *             example:
 *               status: 200
 *               message: Record Fetched Successfully
 *               data:
 *                 items:
 *                   - product_variant_id: VAR-1001
 *                     product_id: PROD-100
 *                     product_name: Aviator Sunglasses
 *                     variant_combination: ["Black", "Medium"]
 *                     stock_on_hand: 42
 *                     category_name: sunglasses
 *                     category_id: CAT-1
 *                     sub_category_name: aviator
 *                     sub_category_id: CAT-12
 *                     sold_stock: 8
 *                     total_stock: 50
 *                     total_revenue: 3999.92
 *                 total: 1
 *                 page: 1
 *                 limit: 20
 *                 totalPages: 1
 *       401:
 *         description: Unauthorized — missing/invalid bearer token, or token role is not admin
 *         content:
 *           application/json:
 *             example: { status: 401, message: Unauthorized }
 *       500:
 *         description: Something Went Wrong
 *         content:
 *           application/json:
 *             example: { status: 500, message: Something Went Wrong }
 */

/**
 * @swagger
 * /v1/inventory/stock:
 *   get:
 *     summary: Get the current stock_on_hand for one active variant
 *     tags: [Inventory]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: product_variant_id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Record Fetched Successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Fetched Successfully }
 *                 data: { $ref: '#/components/schemas/InventoryStockResponse' }
 *             example:
 *               status: 200
 *               message: Record Fetched Successfully
 *               data: { product_variant_id: VAR-1001, stock_on_hand: 42 }
 *       401:
 *         description: Unauthorized — missing/invalid bearer token, or token role is not admin
 *         content:
 *           application/json:
 *             example: { status: 401, message: Unauthorized }
 *       404:
 *         description: Variant not found, or not active (is_active false)
 *         content:
 *           application/json:
 *             example: { status: 404, message: Not Found }
 *       500:
 *         description: Something Went Wrong
 *         content:
 *           application/json:
 *             example: { status: 500, message: Something Went Wrong }
 */

/**
 * @swagger
 * /v1/inventory/movements:
 *   get:
 *     summary: Get one variant's identity + current stock, plus its paginated ledger history, newest first
 *     description: Looks the variant up regardless of is_active, unlike the other two endpoints.
 *     tags: [Inventory]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: product_variant_id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *         description: Capped at 100.
 *     responses:
 *       200:
 *         description: Record Fetched Successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Fetched Successfully }
 *                 data: { $ref: '#/components/schemas/InventoryMovementsResponse' }
 *             example:
 *               status: 200
 *               message: Record Fetched Successfully
 *               data:
 *                 product_variant_id: VAR-1001
 *                 product_id: PROD-100
 *                 stock_on_hand: 42
 *                 movements:
 *                   items:
 *                     - _id: 65f1a2b3c4d5e6f7a8b9c0d1
 *                       product_variant_id: VAR-1001
 *                       type: OUTBOUND
 *                       reason: SALE
 *                       quantity: 2
 *                       balance_after: 42
 *                       reference_id: ORD-5001
 *                       reference_type: ORDER
 *                       idempotency_key: ORD-5001-VAR-1001-SALE
 *                       performed_by: null
 *                       note: null
 *                       createdAt: "2026-09-01T10:15:00.000Z"
 *                       updatedAt: "2026-09-01T10:15:00.000Z"
 *                   total: 1
 *                   page: 1
 *                   limit: 20
 *                   totalPages: 1
 *       400:
 *         description: product_variant_id is required
 *         content:
 *           application/json:
 *             example: { status: 400, message: product_variant_id is required }
 *       401:
 *         description: Unauthorized — missing/invalid bearer token, or token role is not admin
 *         content:
 *           application/json:
 *             example: { status: 401, message: Unauthorized }
 *       404:
 *         description: Variant not found
 *         content:
 *           application/json:
 *             example: { status: 404, message: Not Found }
 *       500:
 *         description: Something Went Wrong
 *         content:
 *           application/json:
 *             example: { status: 500, message: Something Went Wrong }
 */
