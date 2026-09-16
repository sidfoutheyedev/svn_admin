/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product + ProductVariant management (requires Bearer auth). Every product resolves to >=1 variant, and every variant that carries sku-tracked stock keeps sku.length === stock_on_hand at all times. Stock is only ever set as a side effect of creating a product/variant (a single INBOUND "STOCKS ADJUSTED" ledger movement) — it is never written directly through the update endpoints, which is why stock_on_hand/sku are excluded from ProductVariantUpdateRequest.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductStatMetric:
 *       type: object
 *       description: A headline value plus its growth vs. the previous equal-length window. `trend` is reserved for a future sparkline series and is always omitted today.
 *       properties:
 *         value: { type: string, example: "12" }
 *         growth: { type: string, example: "+8.33%" }
 *     ProductVariantInput:
 *       type: object
 *       required: [price]
 *       properties:
 *         variant_combination:
 *           type: array
 *           items: { type: string }
 *           example: [black, X]
 *           description: Leave empty for a product with no real variation (e.g. a simple/single-SKU product).
 *         sku:
 *           type: array
 *           items: { type: string }
 *           default: []
 *           example: [SKU-001, SKU-002]
 *           description: One unique code per physical unit currently in stock. Length must equal stock_on_hand exactly (a 400 otherwise), and every code must be globally unique — never reused, even by a previously hard-deleted unit. Must be empty for AFFILIATE products (enforced by a top-level refinement on the whole request, not per-variant). Each code becomes its own sku_unit document; the inventory ledger itself only records the variant's total opening quantity, never individual codes.
 *         price: { type: number, example: 499 }
 *         discount_price: { type: number, example: 399 }
 *         stock_on_hand:
 *           type: integer
 *           example: 2
 *           description: Opening stock for this variant. Must equal sku.length. Recorded as a single INBOUND "STOCKS ADJUSTED" ledger movement for the whole variant (idempotency key `<product_variant_id>:OPENING_STOCK`) — never written to the variant's stock_on_hand field directly.
 *         product_images:
 *           type: array
 *           items: { type: string }
 *         is_default:
 *           type: boolean
 *           description: If omitted on every variant of a new product, the first variant in the array is made the default automatically.
 *     ProductCreateRequest:
 *       type: object
 *       required: [product_name, brand_id, category, sub_category, product_description, gender, variants]
 *       properties:
 *         product_name: { type: string, example: Mens T-Shirt }
 *         brand_id: { type: string }
 *         category: { type: string, description: A category_id. }
 *         sub_category: { type: string, description: A category_id (of a different category document than `category`). }
 *         GST: { type: string, example: 29ABCDE1234F1Z5 }
 *         product_description: { type: string }
 *         gender: { type: string, enum: [male, female, others] }
 *         product_type:
 *           type: string
 *           enum: [PHYSICAL, AFFILIATE]
 *           description: Optional. When omitted it's inferred from affiliate_link — a link present means AFFILIATE, absent means PHYSICAL. AFFILIATE products are created with inventory_managed=false and never carry sku-tracked stock.
 *         affiliate_link:
 *           type: string
 *           format: uri
 *           description: Required (and must be a URL) when product_type resolves to AFFILIATE, whether that's explicit or inferred. Ignored/stored as null otherwise.
 *         tag:
 *           type: array
 *           items: { type: string }
 *         search_tag:
 *           type: array
 *           items: { type: string }
 *         varient_ids:
 *           type: array
 *           items: { type: string }
 *           example: [color-varient-id, size-varient-id]
 *           description: References to Varient (attribute-type) documents used to label each variant's variant_combination values for display, e.g. combination value "black" resolves to {varient_name:"Color",value:"black"}. Every id must reference an existing, non-deleted Varient, or the request 400s.
 *         status:
 *           type: string
 *           enum: [Live, Draft, Hidden]
 *           default: Live
 *         variants:
 *           type: array
 *           minItems: 1
 *           items: { $ref: '#/components/schemas/ProductVariantInput' }
 *     ProductUpdateRequest:
 *       type: object
 *       description: Every field is optional. product_type and affiliate_link are fixed after creation and cannot be changed here; variants are managed only through the variant endpoints below.
 *       properties:
 *         product_name: { type: string }
 *         brand_id: { type: string }
 *         category: { type: string }
 *         sub_category: { type: string }
 *         GST: { type: string }
 *         product_description: { type: string }
 *         gender: { type: string, enum: [male, female, others] }
 *         tag:
 *           type: array
 *           items: { type: string }
 *         search_tag:
 *           type: array
 *           items: { type: string }
 *         varient_ids:
 *           type: array
 *           items: { type: string }
 *           description: Every id must reference an existing, non-deleted Varient, or the request 400s.
 *         status:
 *           type: string
 *           enum: [Live, Draft, Hidden]
 *     ProductVariantUpdateRequest:
 *       type: object
 *       description: sku and stock_on_hand are deliberately not accepted here — stock only ever changes through the inventory ledger (created at variant-creation time), and sku codes are fixed once assigned.
 *       properties:
 *         variant_combination:
 *           type: array
 *           items: { type: string }
 *         price: { type: number }
 *         discount_price: { type: number }
 *         product_images:
 *           type: array
 *           items: { type: string }
 *         is_default: { type: boolean }
 *     ProductBulkIdsRequest:
 *       type: object
 *       required: [ids]
 *       properties:
 *         ids:
 *           type: array
 *           minItems: 1
 *           items: { type: string }
 *           example: [prod-1, prod-2]
 *           description: product_id values.
 *     ProductBulkStatusRequest:
 *       type: object
 *       required: [ids, status]
 *       properties:
 *         ids:
 *           type: array
 *           minItems: 1
 *           items: { type: string }
 *           example: [prod-1, prod-2]
 *         status:
 *           type: string
 *           enum: [Live, Draft, Hidden]
 *     ProductVariantBulkIdsRequest:
 *       type: object
 *       required: [product_variant_ids]
 *       properties:
 *         product_variant_ids:
 *           type: array
 *           minItems: 1
 *           items: { type: string }
 *           example: [variant-1, variant-2]
 *     ProductVariantCreateResponse:
 *       type: object
 *       description: The raw persisted variant document (not the aggregated/labeled shape used by reads), returned by POST /v1/products (per variant, inside `variants`) and POST /v1/products/variants.
 *       properties:
 *         product_variant_id: { type: string }
 *         product_id: { type: string }
 *         variant_combination: { type: array, items: { type: string } }
 *         price: { type: number }
 *         discount_price: { type: number, nullable: true }
 *         stock_on_hand: { type: integer, description: Always equal to sku.length at creation time. }
 *         product_images: { type: array, items: { type: string } }
 *         is_default: { type: boolean }
 *         is_active: { type: boolean }
 *         sku:
 *           type: array
 *           items: { type: string }
 *           description: The unit-level codes just created for this variant's opening stock (empty for AFFILIATE products, or a variant created with no sku).
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     ProductCreateResponse:
 *       type: object
 *       description: The raw persisted product document plus its just-created variants. This is NOT the aggregated ProductDetail shape returned by the read endpoints (no brand/category lookup, no swipe stats, no selected_varient labeling) — fetch GET /v1/products/details afterwards for that view.
 *       properties:
 *         product_id: { type: string }
 *         product_name: { type: string }
 *         brand_id: { type: string }
 *         category: { type: string }
 *         sub_category: { type: string }
 *         GST: { type: string, nullable: true }
 *         product_description: { type: string }
 *         product_type: { type: string, enum: [PHYSICAL, AFFILIATE] }
 *         inventory_managed: { type: boolean }
 *         affiliate_link: { type: string, nullable: true }
 *         gender: { type: string, enum: [male, female, others] }
 *         tag: { type: array, items: { type: string } }
 *         search_tag: { type: array, items: { type: string } }
 *         varient_ids: { type: array, items: { type: string } }
 *         status: { type: string, enum: [Live, Draft, Hidden] }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *         variants:
 *           type: array
 *           items: { $ref: '#/components/schemas/ProductVariantCreateResponse' }
 *     ProductDetail:
 *       type: object
 *       description: The organized read shape returned by GET /v1/products, GET /v1/products/details and both PATCH endpoints — built by one aggregation pipeline ($lookup on brand/category/sub_category/varients/variants/sku_units), never N+1 per-product queries. Soft-deleted products (is_deleted) never appear here, and `product_varient` only ever holds this product's currently-active (non-soft-deleted) variants.
 *       properties:
 *         product_id: { type: string }
 *         product_name: { type: string }
 *         product_description: { type: string }
 *         GST: { type: string, nullable: true }
 *         product_type: { type: string, enum: [PHYSICAL, AFFILIATE] }
 *         inventory_managed: { type: boolean }
 *         affiliate_link: { type: string, nullable: true }
 *         gender: { type: string, enum: [male, female, others] }
 *         tag:
 *           type: array
 *           items: { type: string }
 *         search_tag:
 *           type: array
 *           items: { type: string }
 *         status: { type: string, enum: [Live, Draft, Hidden] }
 *         brand:
 *           type: object
 *           nullable: true
 *           properties:
 *             brand_id: { type: string }
 *             brand_name: { type: string }
 *         category:
 *           type: object
 *           nullable: true
 *           properties:
 *             category_id: { type: string }
 *             category_name: { type: string }
 *         sub_category:
 *           type: object
 *           nullable: true
 *           properties:
 *             category_id: { type: string }
 *             category_name: { type: string }
 *         selected_varients:
 *           type: array
 *           description: The Varient (attribute-type) documents referenced by varient_ids, resolved for display.
 *           items:
 *             type: object
 *             properties:
 *               varient_id: { type: string }
 *               varient_name: { type: string }
 *               varient_values: { type: array, items: { type: string } }
 *         product_varient:
 *           type: array
 *           description: Only this product's currently-active variants.
 *           items:
 *             type: object
 *             properties:
 *               product_variant_id: { type: string }
 *               variant_combination: { type: array, items: { type: string } }
 *               selected_varient:
 *                 type: array
 *                 description: Each variant_combination value resolved against `selected_varients`, e.g. ["black","X"] -> [{varient_name:"Color",value:"black"},{varient_name:"Size",value:"X"}]. A value not found in any referenced Varient's varient_values resolves to varient_name "Unknown".
 *                 items:
 *                   type: object
 *                   properties:
 *                     varient_name: { type: string }
 *                     value: { type: string }
 *               price: { type: number }
 *               discount_price: { type: number, nullable: true }
 *               stock_on_hand: { type: integer }
 *               product_images: { type: array, items: { type: string } }
 *               is_default: { type: boolean }
 *               is_active: { type: boolean }
 *               sku:
 *                 type: array
 *                 items: { type: string }
 *                 description: sku_code values currently attached to this variant (sold or not).
 *         left_swipe_count:
 *           type: integer
 *           description: Denormalized from ProductSwipeStats (a separate swipe-deck module). 0 until swipe events exist for this product.
 *         right_swipe_count: { type: integer }
 *         saves:
 *           type: integer
 *           description: cart_add_count from ProductSwipeStats — a DOWN swipe ("add to cart").
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     ProductVariantListItem:
 *       type: object
 *       description: The flat row shape returned by GET /v1/products/variants — a variant-management table, not nested under its parent product.
 *       properties:
 *         product_variant_id: { type: string }
 *         product_id: { type: string }
 *         product_name: { type: string, description: Denormalized from the parent product for display in a flat table. }
 *         variant_combination: { type: array, items: { type: string } }
 *         price: { type: number }
 *         discount_price: { type: number, nullable: true }
 *         stock_on_hand: { type: integer }
 *         product_images: { type: array, items: { type: string } }
 *         is_default: { type: boolean }
 *         is_active: { type: boolean }
 *         sku:
 *           type: array
 *           description: Every sku unit attached to this variant, with its sold status.
 *           items:
 *             type: object
 *             properties:
 *               sku_code: { type: string }
 *               is_sold: { type: boolean }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     ProductListSummary:
 *       type: object
 *       description: Page-level metrics for the current search/filter, not per-row. The swipe metrics (left_swipes/right_swipes/saved_products) are scoped to whatever `query`/`category_id` narrowed the list down to, and windowed by `range`/start_date/end_date; the status breakdown (total_product_*) is scoped the same way by query/category_id but always counts every status, ignoring the `status` filter — so the tab counts stay meaningful no matter which status tab is currently selected.
 *       properties:
 *         left_swipes:
 *           allOf: [{ $ref: '#/components/schemas/ProductStatMetric' }]
 *           description: Count of LEFT ("dislike") swipe events in the window.
 *         right_swipes:
 *           allOf: [{ $ref: '#/components/schemas/ProductStatMetric' }]
 *           description: Count of RIGHT ("like") swipe events in the window.
 *         saved_products:
 *           allOf: [{ $ref: '#/components/schemas/ProductStatMetric' }]
 *           description: Count of DOWN ("add to cart") swipe events in the window.
 *         total_product_active:
 *           type: integer
 *           example: 0
 *           description: Count of matching (query/category_id-filtered, non-deleted) products with status Live.
 *         total_product_hidden:
 *           type: integer
 *           example: 0
 *           description: Count of matching products with status Hidden.
 *         total_product_draft:
 *           type: integer
 *           example: 0
 *           description: Count of matching products with status Draft.
 *     ProductCsvImportResult:
 *       type: object
 *       description: Always 201 — a partial import (some product groups/rows failing) is not itself an error, so check failed_count/failed before assuming success.
 *       properties:
 *         created_count: { type: integer }
 *         failed_count: { type: integer }
 *         created:
 *           type: array
 *           items: { $ref: '#/components/schemas/ProductCreateResponse' }
 *         failed:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               row:
 *                 description: A single CSV row number for a parse-level error (e.g. missing product_group_id/price, a mismatched product-level column); the full list of that product group's row numbers for a create-level failure (e.g. a validation or sku-conflict error from the same rules POST /v1/products enforces).
 *                 oneOf:
 *                   - { type: integer }
 *                   - { type: array, items: { type: integer } }
 *               message: { type: string }
 */

/**
 * @swagger
 * /v1/products:
 *   get:
 *     summary: List products (organized, aggregated view — see ProductDetail), excluding soft-deleted ones
 *     tags: [Products]
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
 *         description: >
 *           Case-insensitive prefix match against product_name. Also matched
 *           (same prefix regex) against the raw category/sub_category id
 *           fields, not their display names — so this only additionally
 *           matches if you pass a literal category_id/sub_category_id string.
 *       - in: query
 *         name: category_id
 *         schema: { type: string }
 *         description: Matches against either the product's category or sub_category field.
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Live, Draft, Hidden] }
 *         description: Filters the returned list only — the status breakdown in `summary` always covers every status regardless of this filter.
 *       - in: query
 *         name: range
 *         schema: { type: string, enum: [7d, 30d, 90d], default: 30d }
 *         description: Window for the left_swipes/right_swipes/saved_products summary metrics; ignored if start_date/end_date are both given. Does not affect which products are listed.
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: date }
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     items: { type: array, items: { $ref: '#/components/schemas/ProductDetail' } }
 *                     total: { type: integer }
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     totalPages: { type: integer }
 *                     summary: { $ref: '#/components/schemas/ProductListSummary' }
 *       401: { description: Unauthorized (missing/invalid bearer token) }
 *   post:
 *     summary: Create a product with its variant(s) and opening stock, if any
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductCreateRequest' }
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
 *                 data: { $ref: '#/components/schemas/ProductCreateResponse' }
 *       400:
 *         description: Validation error — no variants, a variant's sku.length not matching stock_on_hand, an AFFILIATE product carrying sku-tracked stock, an unknown varient_id, an AFFILIATE product missing affiliate_link, or a duplicate sku code repeated within the payload itself.
 *       401: { description: Unauthorized }
 *       409: { description: A sku code already exists on another unit, or a generated internal id collided (duplicate key). }
 *   patch:
 *     summary: Update a product's descriptive fields by ?product_id= (product_type/affiliate_link are fixed after creation; variants are edited only via the variant endpoints below)
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: product_id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductUpdateRequest' }
 *     responses:
 *       200:
 *         description: Updated — returns the same organized ProductDetail shape as GET /v1/products/details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Updated Successfully }
 *                 data: { $ref: '#/components/schemas/ProductDetail' }
 *       400: { description: Validation error, or one of the given varient_ids does not reference an existing, non-deleted Varient }
 *       401: { description: Unauthorized }
 *       404: { description: No product with that product_id, or it is already soft-deleted }
 */

/**
 * @swagger
 * /v1/products/details:
 *   get:
 *     summary: Get a single product by ?product_id= (organized, aggregated view — see ProductDetail)
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: product_id
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
 *                 data: { $ref: '#/components/schemas/ProductDetail' }
 *       401: { description: Unauthorized }
 *       404: { description: No product with that product_id, or it is soft-deleted }
 */

/**
 * @swagger
 * /v1/products/hard-delete:
 *   post:
 *     summary: Permanently delete products together with all of their variants and sku units. Inventory ledger movements are kept as an audit trail and are not deleted. Irreversible. Does not check whether the products exist first — deletedCount simply reflects however many actually matched.
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductBulkIdsRequest' }
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     deleted: { type: integer, example: 2, description: Number of product documents actually removed. }
 *       400: { description: Validation error, e.g. an empty ids array }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /v1/products/soft-delete:
 *   post:
 *     summary: Soft-delete products — flags is_deleted true (excluded from every read/list/aggregation from then on) and also deactivates (is_active=false) every one of their variants. Fully reversible directly in the database; nothing is removed. Does not check whether the products exist first.
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductBulkIdsRequest' }
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     updated: { type: integer, example: 2, description: Number of products that were not already soft-deleted and just got flagged. }
 *       400: { description: Validation error, e.g. an empty ids array }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /v1/products/status:
 *   patch:
 *     summary: Bulk-update the status (Live/Draft/Hidden) of one or more products
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductBulkStatusRequest' }
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Updated Successfully }
 *                 data:
 *                   type: object
 *                   properties:
 *                     updated: { type: integer, example: 2 }
 *       400: { description: Validation error, e.g. an empty ids array or an invalid status value }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /v1/products/variants:
 *   get:
 *     summary: List every currently-active variant across every non-deleted product, flat (a variant-management table, not nested under its product). Optionally scoped to one product via ?product_id=.
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: query
 *         schema: { type: string }
 *         description: Case-insensitive prefix search on the parent product's product_name.
 *       - in: query
 *         name: product_id
 *         schema: { type: string }
 *         description: Restrict results to this product's own variants.
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     items: { type: array, items: { $ref: '#/components/schemas/ProductVariantListItem' } }
 *                     total: { type: integer }
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     totalPages: { type: integer }
 *       401: { description: Unauthorized }
 *   post:
 *     summary: Add a new variant (e.g. a new color/size combination) to an existing PHYSICAL product by ?product_id=
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: product_id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductVariantInput' }
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
 *                 data: { $ref: '#/components/schemas/ProductVariantCreateResponse' }
 *       400: { description: Validation error, sku.length not matching stock_on_hand, or the parent product's product_type is AFFILIATE (affiliate products cannot gain additional inventory-managed variants) }
 *       401: { description: Unauthorized }
 *       404: { description: No product with that product_id }
 *       409: { description: A sku code already exists on another unit, or a generated internal id collided }
 *   patch:
 *     summary: Update an existing, active variant's own fields by ?product_variant_id=
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: product_variant_id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductVariantUpdateRequest' }
 *     responses:
 *       200:
 *         description: Updated — returns the raw persisted variant document (no `sku` key is added here, unlike the create responses).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Updated Successfully }
 *                 data:
 *                   type: object
 *                   properties:
 *                     product_variant_id: { type: string }
 *                     product_id: { type: string }
 *                     variant_combination: { type: array, items: { type: string } }
 *                     price: { type: number }
 *                     discount_price: { type: number, nullable: true }
 *                     stock_on_hand: { type: integer }
 *                     product_images: { type: array, items: { type: string } }
 *                     is_default: { type: boolean }
 *                     is_active: { type: boolean }
 *       400: { description: Validation error }
 *       401: { description: Unauthorized }
 *       404: { description: No variant with that product_variant_id that is currently active (is_active=true) }
 *       409: { description: A generated internal id collided (duplicate key) }
 */

/**
 * @swagger
 * /v1/products/variants/hard-delete:
 *   post:
 *     summary: Permanently delete variants together with their sku units. Inventory ledger movements are kept as an audit trail. Refuses to delete every variant that currently exists for any affected product — every product must always retain at least one. Irreversible.
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductVariantBulkIdsRequest' }
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     deleted: { type: integer, example: 1 }
 *       400: { description: "Would leave one or more products with zero variants left, e.g.: \"Cannot delete every variant of a product — product(s) would have none left: p1\"" }
 *       401: { description: Unauthorized }
 *       404: { description: None of the given product_variant_ids exist }
 */

/**
 * @swagger
 * /v1/products/variants/soft-delete:
 *   post:
 *     summary: Soft-delete variants — flags is_active false (the same field every read already filters on, so it disappears from GET /v1/products/variants and from its parent's ProductDetail.variants immediately). Refuses to deactivate every currently-active variant of any affected product. Fully reversible directly in the database.
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductVariantBulkIdsRequest' }
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     updated: { type: integer, example: 1 }
 *       400: { description: "Would leave one or more products with zero active variants left, e.g.: \"Cannot deactivate every active variant of a product — product(s) would have none left: p1\"" }
 *       401: { description: Unauthorized }
 *       404: { description: None of the given product_variant_ids are currently active }
 */

/**
 * @swagger
 * /v1/products/csv/sample:
 *   get:
 *     summary: Download a sample CSV template for bulk product import
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: A CSV file (products-sample.csv, Content-Disposition attachment). One row per variant; every row sharing the same product_group_id column belongs to the same product and must repeat identical product-level values (product_name, brand_id, category, sub_category, GST, product_description, product_type, affiliate_link, gender, tag, search_tag, varient_ids, status) — a mismatch on any of those between rows of the same group fails that row on import. List-valued columns (tag, search_tag, varient_ids, variant_combination, sku, product_images) are pipe ("|") separated, not comma-separated.
 *         content:
 *           text/csv:
 *             schema: { type: string }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /v1/products/csv:
 *   post:
 *     summary: Bulk-create products from an uploaded CSV file. Every parsed product group goes through the exact same createProduct logic (and therefore the same validation) as POST /v1/products, so a CSV import can never bypass a rule the JSON API enforces.
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: A .csv file (field name must be exactly "file") matching the shape from GET /v1/products/csv/sample. Max 5MB; rejected with a 400 if the mimetype/extension isn't csv-like.
 *     responses:
 *       201:
 *         description: Import finished — always 201 even when some/all rows failed; check failed_count and failed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 201 }
 *                 message: { type: string, example: Record Created Successfully }
 *                 data: { $ref: '#/components/schemas/ProductCsvImportResult' }
 *       400: { description: No file was uploaded under the "file" field, or multer rejected it (wrong type or over 5MB) }
 *       401: { description: Unauthorized }
 *   get:
 *     summary: Export every non-deleted product's currently-active variants as a CSV file, in the same shape the importer expects (a product's own product_id is written back out as product_group_id, so re-importing the export round-trips unambiguously)
 *     tags: [Products]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: A CSV file (products-export.csv, Content-Disposition attachment). One row per active variant; a product with zero active variants contributes no rows at all.
 *         content:
 *           text/csv:
 *             schema: { type: string }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /v1/products/recommendation/csv:
 *   get:
 *     summary: Export a recommendation/embedding feed as a CSV file — one row per non-deleted product, sourced from that product's is_default variant. Public endpoint, no auth required.
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: >
 *           A CSV file (products-recommendation-export.csv, Content-Disposition attachment) with columns
 *           product_id, title, brand, gender, category, subcategory, style, price, in_stock, is_active, primary_image, embedding_text.
 *           One row per product; a product with no is_default variant contributes no row.
 *           brand/category/subcategory are resolved from ids to names. style currently mirrors category (no dedicated style attribute exists yet).
 *           price/in_stock/is_active/primary_image come from the product's is_default variant (primary_image is the first entry of that variant's product_images).
 *           embedding_text is "{title}. {subcategory}, {variant_combination values}, {tags}, {brand}", skipping empty pieces.
 *         content:
 *           text/csv:
 *             schema: { type: string }
 */
