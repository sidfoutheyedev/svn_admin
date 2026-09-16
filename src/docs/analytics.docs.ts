/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Read-only reporting/dashboard endpoints that aggregate counts and revenue across products, orders, refunds, users, brands, and swipe events for a given time window. No create/update/delete operations. NOTE — although this module imports the requireAuth bearer-JWT guard, analytics.routes.ts never actually wires it onto any of the routes below, so all three endpoints currently run without any auth check despite the app-wide default requiring a bearer token.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AnalyticsStatMetric:
 *       type: object
 *       description: Headline value plus its percent change vs. the equal-length window immediately preceding the one requested.
 *       properties:
 *         value:
 *           type: string
 *           description: The metric's current value, stringified (a plain count, or a "12.34%" rate for refund_rate).
 *           example: "128"
 *         growth:
 *           type: string
 *           description: Percent change vs. the previous window of the same length, formatted with an explicit sign, e.g. "+12.4%", "-3.1%", or "0%".
 *           example: "+12.4%"
 *         trend:
 *           type: array
 *           items: { type: number }
 *           description: Reserved for a future daily-bucketed sparkline series. Never populated by the current implementation (always omitted/undefined).
 *     AnalyticsCategorySavedShare:
 *       type: object
 *       description: One slice of the "saved products by category" breakdown. A product's category here is its top-level category (Product.category), not its sub-category. When a swiped product's category can't be resolved (e.g. missing/deleted), it is bucketed under category_id "uncategorized" / category_name "Others" rather than dropped, so counts sum to the window's saved_products total.
 *       properties:
 *         category_id:
 *           type: string
 *           example: cat_123
 *         category_name:
 *           type: string
 *           example: sneakers
 *         count:
 *           type: integer
 *           example: 42
 *         percentage:
 *           type: number
 *           description: This slice's share of the window's total saved_products count, e.g. 67 for 67%. 0 when the window has no saved products.
 *           example: 67.35
 *     AnalyticsStatsOverviewResponse:
 *       type: object
 *       properties:
 *         products:
 *           allOf:
 *             - $ref: '#/components/schemas/AnalyticsStatMetric'
 *           description: Current total count of non-deleted products (value), with growth comparing products created in the current window vs. the previous window.
 *         orders:
 *           allOf:
 *             - $ref: '#/components/schemas/AnalyticsStatMetric'
 *           description: Order-volume count — every non-deleted order placed within the window, regardless of later cancellation/return.
 *         refund_rate:
 *           allOf:
 *             - $ref: '#/components/schemas/AnalyticsStatMetric'
 *           description: (refunds / orders) * 100 for the window, formatted as a percentage string, e.g. "3.45%".
 *         total_users:
 *           allOf:
 *             - $ref: '#/components/schemas/AnalyticsStatMetric'
 *           description: Current total count of non-deleted users, with growth comparing users created in the current window vs. the previous window.
 *         brands:
 *           allOf:
 *             - $ref: '#/components/schemas/AnalyticsStatMetric'
 *           description: Current total count of non-deleted brands, with growth comparing brands created in the current window vs. the previous window.
 *         saved_products:
 *           allOf:
 *             - $ref: '#/components/schemas/AnalyticsStatMetric'
 *           description: Count of DOWN-direction swipe events within the window.
 *         saved_by_category:
 *           type: array
 *           description: saved_products broken down by each swiped product's top-level category. Sorted by count, descending.
 *           items: { $ref: '#/components/schemas/AnalyticsCategorySavedShare' }
 *     AnalyticsRevenueOverviewResponse:
 *       type: object
 *       properties:
 *         total_revenue:
 *           allOf:
 *             - $ref: '#/components/schemas/AnalyticsStatMetric'
 *           description: Sum of every order line's line_total for non-deleted orders in the window, excluding orders with status CANCELLED or RETURNED.
 *         onboarded_revenue:
 *           allOf:
 *             - $ref: '#/components/schemas/AnalyticsStatMetric'
 *           description: Same as total_revenue but restricted to order lines with inventory_managed true (physical/onboarded catalog). affiliate_revenue is intentionally not reported — affiliate product management isn't built out yet.
 *     AnalyticsTopPerformingProduct:
 *       type: object
 *       description: One product ranked by LEFT-direction ("like") swipe count within the resolved window.
 *       properties:
 *         product_id: { type: string, example: PROD-100 }
 *         product_name: { type: string, example: Aviator Sunglasses }
 *         product_image:
 *           type: string
 *           nullable: true
 *           description: First image of the product's default (or first active) variant. null when the variant has no images.
 *           example: https://cdn.example.com/products/aviator-black.png
 *         category_id: { type: string, nullable: true, example: CAT-1 }
 *         category_name: { type: string, nullable: true, example: sunglasses }
 *         sub_category_id: { type: string, nullable: true, example: CAT-12 }
 *         sub_category_name: { type: string, nullable: true, example: aviator }
 *         left_swipe_count:
 *           type: integer
 *           description: Count of LEFT swipes ("like") for this product within the resolved window.
 *           example: 154
 *         growth_rate:
 *           type: string
 *           description: Percent change in left_swipe_count vs. the equal-length window immediately before the resolved one, formatted with an explicit sign, e.g. "+12.4%", "-3.1%", or "0%".
 *           example: "+12.4%"
 *     AnalyticsTopPerformingProductsResponse:
 *       type: array
 *       description: Top 10 products by left_swipe_count within the resolved window, sorted descending. Empty array when no LEFT swipes fall in the window.
 *       items: { $ref: '#/components/schemas/AnalyticsTopPerformingProduct' }
 *     AnalyticsErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *           example: 500
 *         message:
 *           type: string
 *           example: Something Went Wrong
 */

/**
 * @swagger
 * /v1/analytics/stats:
 *   get:
 *     summary: Stats overview — current totals (with growth) for products/total_users/brands, an order-volume count and refund rate for the window, and saved-products (DOWN swipes) broken down by category
 *     description: |
 *       Accepts either a rolling `range` (7d/30d/90d, defaults to 30d when omitted or invalid) or an explicit `start_date`/`end_date` window (used only when both are valid dates and end_date is after start_date; otherwise falls back to `range`). growth on every metric compares the resolved window against the equal-length window immediately before it.
 *     tags: [Analytics]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: range
 *         schema: { type: string, enum: [7d, 30d, 90d], default: 30d }
 *         description: Rolling window to report on. Ignored when start_date/end_date are both given and valid. Falls back to 30d if omitted or not one of the enum values.
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: date }
 *         description: ISO date. Only takes effect together with a valid end_date that is after it; otherwise range is used instead.
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: date }
 *         description: ISO date, must be after start_date to take effect.
 *     responses:
 *       200:
 *         description: Successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Fetched Successfully }
 *                 data: { $ref: '#/components/schemas/AnalyticsStatsOverviewResponse' }
 *             example:
 *               status: 200
 *               message: Record Fetched Successfully
 *               data:
 *                 products: { value: "356", growth: "+4.2%" }
 *                 orders: { value: "128", growth: "+12.4%" }
 *                 refund_rate: { value: "3.45%", growth: "-1.1%" }
 *                 total_users: { value: "980", growth: "+2.0%" }
 *                 brands: { value: "42", growth: "0%" }
 *                 saved_products: { value: "215", growth: "+8.6%" }
 *                 saved_by_category:
 *                   - category_id: cat_123
 *                     category_name: sneakers
 *                     count: 90
 *                     percentage: 41.86
 *                   - category_id: uncategorized
 *                     category_name: Others
 *                     count: 12
 *                     percentage: 5.58
 *       500:
 *         description: Something Went Wrong — an unexpected error while resolving the window or aggregating the underlying counts.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AnalyticsErrorResponse' }
 */

/**
 * @swagger
 * /v1/analytics/revenue:
 *   get:
 *     summary: Revenue overview — total revenue across non-cancelled/non-returned orders in the window, split out to the inventory-managed (onboarded) subset
 *     description: |
 *       Accepts either a rolling `range` (7d/30d/90d, defaults to 30d when omitted or invalid) or an explicit `start_date`/`end_date` window (used only when both are valid dates and end_date is after start_date; otherwise falls back to `range`). growth compares the resolved window against the equal-length window immediately before it.
 *     tags: [Analytics]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: range
 *         schema: { type: string, enum: [7d, 30d, 90d], default: 30d }
 *         description: Rolling window to report on. Ignored when start_date/end_date are both given and valid. Falls back to 30d if omitted or not one of the enum values.
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: date }
 *         description: ISO date. Only takes effect together with a valid end_date that is after it; otherwise range is used instead.
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: date }
 *         description: ISO date, must be after start_date to take effect.
 *     responses:
 *       200:
 *         description: Successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Fetched Successfully }
 *                 data: { $ref: '#/components/schemas/AnalyticsRevenueOverviewResponse' }
 *             example:
 *               status: 200
 *               message: Record Fetched Successfully
 *               data:
 *                 total_revenue: { value: "184320", growth: "+9.7%" }
 *                 onboarded_revenue: { value: "152040", growth: "+7.3%" }
 *       500:
 *         description: Something Went Wrong — an unexpected error while resolving the window or aggregating order totals.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AnalyticsErrorResponse' }
 */

/**
 * @swagger
 * /v1/analytics/top-performer:
 *   get:
 *     summary: Top performing products — the 10 products with the most LEFT ("like") swipes in the window, with growth vs. the previous window
 *     description: |
 *       Accepts either a rolling `range` (7d/30d/90d, defaults to 30d when omitted or invalid) or an explicit `start_date`/`end_date` window (used only when both are valid dates and end_date is after start_date; otherwise falls back to `range`). Ranks products by count of LEFT-direction swipe events within the resolved window, descending, capped at 10. Each product's growth_rate compares its left_swipe_count against the equal-length window immediately before it.
 *     tags: [Analytics]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: range
 *         schema: { type: string, enum: [7d, 30d, 90d], default: 30d }
 *         description: Rolling window to report on. Ignored when start_date/end_date are both given and valid. Falls back to 30d if omitted or not one of the enum values.
 *       - in: query
 *         name: start_date
 *         schema: { type: string, format: date }
 *         description: ISO date. Only takes effect together with a valid end_date that is after it; otherwise range is used instead.
 *       - in: query
 *         name: end_date
 *         schema: { type: string, format: date }
 *         description: ISO date, must be after start_date to take effect.
 *     responses:
 *       200:
 *         description: Successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Fetched Successfully }
 *                 data: { $ref: '#/components/schemas/AnalyticsTopPerformingProductsResponse' }
 *             example:
 *               status: 200
 *               message: Record Fetched Successfully
 *               data:
 *                 - product_id: PROD-100
 *                   product_name: Aviator Sunglasses
 *                   product_image: https://cdn.example.com/products/aviator-black.png
 *                   category_id: CAT-1
 *                   category_name: sunglasses
 *                   sub_category_id: CAT-12
 *                   sub_category_name: aviator
 *                   left_swipe_count: 154
 *                   growth_rate: "+12.4%"
 *       500:
 *         description: Something Went Wrong — an unexpected error while resolving the window or aggregating the swipe counts.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AnalyticsErrorResponse' }
 */
