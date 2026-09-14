/**
 * @swagger
 * tags:
 *   name: Brands
 *   description: CRUD and bulk-status management for brands, with soft delete (is_deleted flag, recoverable) kept separate from hard delete (permanent removal); all routes require Bearer auth.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     BrandStatMetric:
 *       type: object
 *       description: >
 *         A headline value plus its growth versus the immediately preceding
 *         window of the same length. Note `value` is a numeric string
 *         (e.g. "48920"), not a JSON number — it is produced by `String(value)`.
 *         `growth` is a formatted percentage string with an explicit sign,
 *         e.g. "+12.34%", "-5%", or "0%" (no sign when unchanged).
 *       properties:
 *         value: { type: string, example: "48920" }
 *         growth: { type: string, example: "+12.34%" }
 *     BrandCreateRequest:
 *       type: object
 *       required: [brand_name, brand_image, brand_tag, brand_search_tag]
 *       properties:
 *         brand_name: { type: string, minLength: 1, example: Trendy T-Shirt }
 *         brand_image: { type: string, minLength: 1, example: https://cdn.example.com/brands/trendy.png }
 *         brand_type:
 *           type: string
 *           enum: [affiliate, onboarding]
 *           default: onboarding
 *           description: Defaults to "onboarding" when omitted (applied in brand.services.ts, not enforced by the Mongoose schema default at the validation layer).
 *         brand_website: { type: string, format: uri, nullable: true, example: https://trendy.example.com }
 *         brand_affiliate_link: { type: string, format: uri, nullable: true, example: https://affiliate.example.com/trendy }
 *         brand_tag:
 *           type: array
 *           items: { type: string, minLength: 1 }
 *           minItems: 1
 *           example: [streetwear, cotton]
 *         brand_search_tag:
 *           type: array
 *           items: { type: string, minLength: 1 }
 *           minItems: 1
 *           example: [trendy, tshirt]
 *         status:
 *           type: string
 *           enum: [Draft, Live, Hidden]
 *           default: Live
 *     BrandUpdateRequest:
 *       type: object
 *       description: Every field from BrandCreateRequest, all optional (zod `.partial()` of the create schema). An empty body `{}` is valid and simply leaves the brand unchanged.
 *       properties:
 *         brand_name: { type: string, minLength: 1 }
 *         brand_image: { type: string, minLength: 1 }
 *         brand_type: { type: string, enum: [affiliate, onboarding] }
 *         brand_website: { type: string, format: uri, nullable: true }
 *         brand_affiliate_link: { type: string, format: uri, nullable: true }
 *         brand_tag:
 *           type: array
 *           items: { type: string, minLength: 1 }
 *           minItems: 1
 *         brand_search_tag:
 *           type: array
 *           items: { type: string, minLength: 1 }
 *           minItems: 1
 *         status: { type: string, enum: [Draft, Live, Hidden] }
 *     BrandBulkIdsRequest:
 *       type: object
 *       required: [ids]
 *       properties:
 *         ids:
 *           type: array
 *           items: { type: string }
 *           minItems: 1
 *           description: Values of `brand_id` (the app-generated hex id), not Mongo `_id`.
 *           example: [a1b2c3d4e5f6, f6e5d4c3b2a1]
 *     BrandBulkStatusRequest:
 *       type: object
 *       required: [ids, status]
 *       properties:
 *         ids:
 *           type: array
 *           items: { type: string }
 *           minItems: 1
 *           example: [a1b2c3d4e5f6, f6e5d4c3b2a1]
 *         status: { type: string, enum: [Draft, Live, Hidden] }
 *     BrandResponse:
 *       type: object
 *       description: The full brand document as stored/returned by Mongoose.
 *       properties:
 *         _id: { type: string, example: 66f0a1b2c3d4e5f678901234 }
 *         brand_id: { type: string, example: a1b2c3d4e5f6 }
 *         brand_name: { type: string, example: Trendy T-Shirt }
 *         brand_image: { type: string, example: https://cdn.example.com/brands/trendy.png }
 *         brand_type: { type: string, enum: [affiliate, onboarding], example: onboarding }
 *         brand_website: { type: string, format: uri, nullable: true, example: null }
 *         brand_affiliate_link: { type: string, format: uri, nullable: true, example: null }
 *         brand_tag:
 *           type: array
 *           items: { type: string }
 *           example: [streetwear, cotton]
 *         brand_search_tag:
 *           type: array
 *           items: { type: string }
 *           example: [trendy, tshirt]
 *         is_deleted: { type: boolean, example: false, description: Soft-delete flag; every read path (list, details, update, name-conflict check) filters on `is_deleted: false`. }
 *         status: { type: string, enum: [Draft, Live, Hidden], example: Live }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *         __v: { type: integer, example: 0 }
 *     BrandListItem:
 *       type: object
 *       description: >
 *         A single row of the brand dashboard table (not the full document —
 *         a projected shape from brandService.listBrands). `total_product` is
 *         the all-time count of products with this `brand_id`; `total_revenue`
 *         is the sum of order line totals for this brand's products within
 *         the selected `range`/date window (orders with status CANCELLED or
 *         RETURNED are excluded). Both are plain numbers, unlike the
 *         page-level metrics in BrandListSummary which are BrandStatMetric
 *         objects with growth.
 *       properties:
 *         brand_id: { type: string, example: a1b2c3d4e5f6 }
 *         brand_name: { type: string, example: Trendy T-Shirt }
 *         brand_affiliate_link: { type: string, format: uri, nullable: true }
 *         brand_type: { type: string, enum: [affiliate, onboarding] }
 *         status: { type: string, enum: [Draft, Live, Hidden] }
 *         total_product: { type: integer, example: 40 }
 *         total_revenue: { type: number, example: 48920 }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     BrandListSummary:
 *       type: object
 *       description: >
 *         Page-level counts and revenue metrics for the selected range
 *         (not per-row). `totalBrand` tracks the current `query`/`brand_type`/
 *         `status` filters (same as the top-level `total`); every other field
 *         here is NOT affected by those filters — computed over all
 *         non-deleted brands/orders. Revenue is split by Brand.brand_type:
 *         affiliate vs onboarding, alongside the grand total.
 *       properties:
 *         totalBrand: { type: integer, example: 12480, description: Count of non-deleted brands matching the current filters (same as the top-level `total`). }
 *         total_brand_live: { type: integer, example: 11902 }
 *         total_brand_hidden: { type: integer, example: 300 }
 *         total_brand_draft: { type: integer, example: 278 }
 *         total_revenue: { $ref: '#/components/schemas/BrandStatMetric' }
 *         affiliate_revenue: { $ref: '#/components/schemas/BrandStatMetric' }
 *         onboarded_revenue: { $ref: '#/components/schemas/BrandStatMetric' }
 *     BrandPerformance:
 *       type: object
 *       description: >
 *         Revenue and units-sold for one brand within the selected range,
 *         alongside its all-time product count. `revenue` and
 *         `products_sold` growth compares against the immediately preceding
 *         window of the same length (orders with status CANCELLED or
 *         RETURNED are excluded).
 *       properties:
 *         revenue: { $ref: '#/components/schemas/BrandStatMetric' }
 *         total_product: { type: integer, example: 8 }
 *         products_sold: { $ref: '#/components/schemas/BrandStatMetric' }
 *     BrandDetailResponse:
 *       allOf:
 *         - $ref: '#/components/schemas/BrandResponse'
 *         - type: object
 *           properties:
 *             performance: { $ref: '#/components/schemas/BrandPerformance' }
 */

/**
 * @swagger
 * /v1/brands:
 *   get:
 *     summary: List brands (paginated dashboard rows, with revenue and status counts)
 *     tags: [Brands]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *         description: Clamped to a maximum of 100.
 *       - in: query
 *         name: query
 *         schema: { type: string }
 *         description: Case-insensitive prefix match against `brand_name` or `brand_search_tag`.
 *       - in: query
 *         name: brand_type
 *         schema: { type: string, enum: [affiliate, onboarding] }
 *         description: Case-insensitive substring match against `brand_type` (not restricted to the enum values at the query layer).
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Draft, Live, Hidden] }
 *         description: Case-insensitive substring match against `status` (not restricted to the enum values at the query layer).
 *       - in: query
 *         name: range
 *         schema: { type: string, enum: [7d, 30d, 90d], default: 30d }
 *         description: Revenue window for row `total_revenue` and the BrandListSummary metrics; ignored if start_date/end_date are both given.
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
 *                     items:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/BrandListItem' }
 *                     total: { type: integer, example: 12480 }
 *                     page: { type: integer, example: 1 }
 *                     limit: { type: integer, example: 20 }
 *                     totalPages: { type: integer, example: 624 }
 *                     summary: { $ref: '#/components/schemas/BrandListSummary' }
 *       401:
 *         description: Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { status: { type: integer, example: 401 }, message: { type: string, example: Unauthorized } } }
 *   post:
 *     summary: Create a brand
 *     description: >
 *       **Known routing bug:** brand.routes.ts registers a second
 *       `router.post("/", requireAuth, deleteBrand)` right after this create
 *       route (intended as the soft-delete counterpart to `POST
 *       /hard-delete` — an earlier revision used `router.delete("/", ...)`
 *       until commit 128fe0c changed it to `router.post("/", ...)`). Because
 *       both are registered on the same method+path, Express only ever
 *       invokes the first match — this create handler — which always sends a
 *       response and never calls `next()`. The `deleteBrand` registration is
 *       therefore dead code: `POST /v1/brands` will always attempt to
 *       **create** a brand (and 400 if the body looks like `{ ids: [...] }`,
 *       since that fails `brandSchema` validation), never soft-delete one.
 *       Soft-deleting is currently unreachable via HTTP with this router as
 *       written.
 *     tags: [Brands]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/BrandCreateRequest' }
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
 *                 data: { $ref: '#/components/schemas/BrandResponse' }
 *       400:
 *         description: Validation error (zod) — message is the comma-joined list of field error messages.
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { status: { type: integer, example: 400 }, message: { type: string, example: "String must contain at least 1 character(s)" } } }
 *       401:
 *         description: Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { status: { type: integer, example: 401 }, message: { type: string, example: Unauthorized } } }
 *       409:
 *         description: A non-deleted brand with this `brand_name` already exists
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { status: { type: integer, example: 409 }, message: { type: string, example: Record Already Exists } } }
 *       500:
 *         description: Unexpected server/database error
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { status: { type: integer, example: 500 }, message: { type: string, example: Something Went Wrong } } }
 *   patch:
 *     summary: Update a brand by ?brand_id=
 *     tags: [Brands]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: brand_id
 *         required: true
 *         schema: { type: string }
 *         description: The app-generated `brand_id`, not Mongo `_id`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/BrandUpdateRequest' }
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
 *                 data: { $ref: '#/components/schemas/BrandResponse' }
 *       400:
 *         description: Validation error (zod)
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { status: { type: integer, example: 400 }, message: { type: string } } }
 *       401:
 *         description: Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { status: { type: integer, example: 401 }, message: { type: string, example: Unauthorized } } }
 *       404:
 *         description: No non-deleted brand with this brand_id
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { status: { type: integer, example: 404 }, message: { type: string, example: Not Found } } }
 *       500:
 *         description: Unexpected server/database error
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { status: { type: integer, example: 500 }, message: { type: string, example: Something Went Wrong } } }
 */

/**
 * @swagger
 * /v1/brands/details:
 *   get:
 *     summary: Get a single brand by ?brand_id=, with its performance metrics
 *     tags: [Brands]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: brand_id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: range
 *         schema: { type: string, enum: [7d, 30d, 90d], default: 30d }
 *         description: Window for `performance.revenue`/`performance.products_sold`; ignored if start_date/end_date are both given.
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
 *                 data: { $ref: '#/components/schemas/BrandDetailResponse' }
 *       401:
 *         description: Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { status: { type: integer, example: 401 }, message: { type: string, example: Unauthorized } } }
 *       404:
 *         description: No non-deleted brand with this brand_id
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { status: { type: integer, example: 404 }, message: { type: string, example: Not Found } } }
 */

/**
 * @swagger
 * /v1/brands/hard-delete:
 *   post:
 *     summary: Permanently delete brands by id (bulk, irreversible)
 *     description: >
 *       Removes the documents entirely via `deleteMany` — no `is_deleted`
 *       filter, so this also permanently removes brands that were already
 *       soft-deleted. There is no not-found check; deleting ids that don't
 *       match anything still returns 200 with a `deleted` count of 0.
 *     tags: [Brands]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/BrandBulkIdsRequest' }
 *     responses:
 *       200:
 *         description: OK (deleted count may be 0 if no ids matched)
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
 *                     deleted: { type: integer, example: 2 }
 *       400:
 *         description: Validation error (zod) — e.g. `ids` missing or empty
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { status: { type: integer, example: 400 }, message: { type: string } } }
 *       401:
 *         description: Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { status: { type: integer, example: 401 }, message: { type: string, example: Unauthorized } } }
 *       500:
 *         description: Unexpected server/database error
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { status: { type: integer, example: 500 }, message: { type: string, example: Something Went Wrong } } }
 */

/**
 * @swagger
 * /v1/brands/status:
 *   patch:
 *     summary: Bulk update the status of brands by id
 *     description: >
 *       Only affects non-deleted brands (where `is_deleted` is false).
 *       There is no not-found check; ids that don't match anything still
 *       return 200 with an `updated` count of 0.
 *     tags: [Brands]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/BrandBulkStatusRequest' }
 *     responses:
 *       200:
 *         description: OK (updated count may be 0 if no ids matched)
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
 *       400:
 *         description: Validation error (zod) — e.g. `ids`/`status` missing or `status` not one of Draft, Live, Hidden
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { status: { type: integer, example: 400 }, message: { type: string } } }
 *       401:
 *         description: Missing or invalid bearer token
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { status: { type: integer, example: 401 }, message: { type: string, example: Unauthorized } } }
 *       500:
 *         description: Unexpected server/database error
 *         content:
 *           application/json:
 *             schema: { type: object, properties: { status: { type: integer, example: 500 }, message: { type: string, example: Something Went Wrong } } }
 */
