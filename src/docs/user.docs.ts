/**
 * @swagger
 * tags:
 *   name: Users
 *   description: >
 *     Admin-panel management of end-user accounts — paginated listing with
 *     profile join and status breakdown, single-user detail (with a
 *     computed "style DNA" preference summary), bulk status update, and
 *     bulk soft/hard delete.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserListItem:
 *       type: object
 *       description: >
 *         One row of GET /v1/users — the User document flattened with a
 *         left-joined UserProfile (profile.* fields are null when the user
 *         has no profile document yet).
 *       properties:
 *         _id: { type: string, example: 66f1a2b3c4d5e6f7a8b9c0d1 }
 *         user_id: { type: string, example: 8c2e4f6a1b3d }
 *         email: { type: string, example: jane@gmail.com }
 *         status: { type: string, enum: [active, inactive, suspended], example: active }
 *         lastLogin: { type: string, format: date-time, nullable: true }
 *         createdAt: { type: string, format: date-time }
 *         full_name: { type: string, nullable: true, example: Jane Doe }
 *         phone: { type: string, nullable: true, example: "9876543210" }
 *         dob: { type: string, format: date-time, nullable: true }
 *         gender: { type: string, enum: [male, female, others], nullable: true }
 *     UserListSummary:
 *       type: object
 *       description: >
 *         Status breakdown computed over the same base match (is_deleted:
 *         false, role: "user") and the same free-text `query` search as
 *         the list, but WITHOUT the `status` filter — so it always shows
 *         the full breakdown even when the list itself is filtered down
 *         to one status.
 *       properties:
 *         total_user: { type: integer, example: 1280, description: Sum of active + inactive + suspended counts only (excludes any other/unset status value). }
 *         total_active_user: { type: integer, example: 1140 }
 *         total_inactive_user: { type: integer, example: 90 }
 *         total_suspended_user: { type: integer, example: 50 }
 *     UserListResponse:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items: { $ref: '#/components/schemas/UserListItem' }
 *         total: { type: integer, example: 42 }
 *         page: { type: integer, example: 1 }
 *         limit: { type: integer, example: 20 }
 *         totalPages: { type: integer, example: 3 }
 *         summary: { $ref: '#/components/schemas/UserListSummary' }
 *     UserStyleDnaSlice:
 *       type: object
 *       properties:
 *         preference_id: { type: string, example: pref_9f1c2 }
 *         label: { type: string, description: category_name of the preference's category, example: Streetwear }
 *         score: { type: number, example: 8 }
 *         percentage:
 *           type: integer
 *           description: >
 *             Largest-remainder rounded share of this slice's score out of
 *             the sum of all slices' scores, so all percentages across the
 *             array always sum to exactly 100.
 *           example: 42
 *     UserStyleDna:
 *       type: object
 *       description: >
 *         Derived from the user's UserPreferences document, joined to
 *         (non-deleted) Preferences and their Category, sorted by score
 *         desc then priority desc. Empty when the user has no preferences
 *         or none of them resolve to a non-deleted preference/category.
 *       properties:
 *         slices:
 *           type: array
 *           items: { $ref: '#/components/schemas/UserStyleDnaSlice' }
 *         note:
 *           type: string
 *           nullable: true
 *           description: category_description of the highest-scoring slice's category, or null if slices is empty.
 *     UserDetailResponse:
 *       type: object
 *       description: >
 *         GET /v1/users/details — the User document flattened with its
 *         UserProfile (non-deleted) plus a computed style_dna block.
 *         Profile-derived fields are null if the user has no (non-deleted)
 *         profile document.
 *       properties:
 *         user_id: { type: string, example: 8c2e4f6a1b3d }
 *         email: { type: string, example: jane@gmail.com }
 *         role: { type: string, enum: [admin, user], example: user }
 *         provider: { type: string, enum: [local, google, apple], example: local }
 *         full_name: { type: string, nullable: true, example: Jane Doe }
 *         dob: { type: string, format: date-time, nullable: true }
 *         gender: { type: string, enum: [male, female, others], nullable: true }
 *         profile_images: { type: string, nullable: true }
 *         phone: { type: string, nullable: true, example: "9876543210" }
 *         new_brand_reminder: { type: boolean, nullable: true }
 *         trend_reminder: { type: boolean, nullable: true }
 *         more_reminder: { type: boolean, nullable: true }
 *         status: { type: string, enum: [active, inactive, suspended], example: active }
 *         lastLogin: { type: string, format: date-time, nullable: true }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *         style_dna: { $ref: '#/components/schemas/UserStyleDna' }
 *     UserStatusUpdateRequest:
 *       type: object
 *       description: >
 *         Validated by userStatusSchema (Zod). NOTE: the schema's status
 *         enum is [active, inactive, suspended] — it does NOT accept
 *         "inactive", even though that is the value actually stored by
 *         the User model's own status enum ([active, inactive, suspended])
 *         and returned in list/detail responses. A request with
 *         status: "inactive" passes validation and is written to the
 *         database as-is via updateMany (which does not run schema
 *         validators), so it is possible to persist a status value the
 *         User model schema does not otherwise recognize.
 *       required: [user_ids, status]
 *       properties:
 *         user_ids:
 *           type: array
 *           items: { type: string }
 *           minItems: 1
 *           example: [8c2e4f6a1b3d, 5f3a1b9c02d4]
 *         status:
 *           type: string
 *           enum: [active, inactive, suspended]
 *           example: active
 *     UserStatusUpdateResult:
 *       type: object
 *       properties:
 *         updated: { type: integer, description: modifiedCount from the updateMany call, example: 2 }
 *     UserBulkIdsRequest:
 *       type: object
 *       description: Validated by userRemoveSchema (Zod). Shared shape for /remove and /hard-delete.
 *       required: [user_ids]
 *       properties:
 *         user_ids:
 *           type: array
 *           items: { type: string }
 *           minItems: 1
 *           example: [8c2e4f6a1b3d, 5f3a1b9c02d4]
 *     UserRemoveResult:
 *       type: object
 *       description: Soft-delete result — sets is_deleted true on matching, non-already-deleted users.
 *       properties:
 *         removed: { type: integer, description: modifiedCount from the updateMany call, example: 2 }
 *     UserHardRemoveResult:
 *       type: object
 *       description: >
 *         Hard-delete result — permanently removes matching User documents
 *         via deleteMany (no is_deleted filter, so already soft-deleted
 *         users are also eligible; profile/preference documents for these
 *         users are not cascaded or cleaned up by this call).
 *       properties:
 *         deleted: { type: integer, description: deletedCount from the deleteMany call, example: 2 }
 *     UserErrorResponse:
 *       type: object
 *       properties:
 *         status: { type: integer, example: 400 }
 *         message: { type: string, example: Not Found }
 */

/**
 * @swagger
 * /v1/users:
 *   get:
 *     summary: List users (paginated, profile-joined, with status summary)
 *     description: >
 *       Scoped to role "user" and is_deleted false. `query` matches
 *       (case-insensitive) against the joined profile's full_name or the
 *       user's email. `status` narrows the returned `items` and `total`
 *       only — `summary` is always computed across all statuses (still
 *       respecting `query`). Sorted by createdAt descending.
 *     tags: [Users]
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
 *         description: Case-insensitive search against profile full_name or email.
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, inactive, suspended] }
 *         description: Filters the list only, not the summary.
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
 *                 data: { $ref: '#/components/schemas/UserListResponse' }
 *       401:
 *         description: Missing/invalid bearer token, or token role is not "admin"
 *         content:
 *           application/json:
 *             example: { status: 401, message: Unauthorized }
 *       500:
 *         description: Unexpected error
 *         content:
 *           application/json:
 *             example: { status: 500, message: Something Went Wrong }
 */

/**
 * @swagger
 * /v1/users/details:
 *   get:
 *     summary: Get a single user's full detail, including their style DNA
 *     description: >
 *       Looks the user up by user_id (is_deleted false), flattens in their
 *       (non-deleted) UserProfile, and attaches a computed style_dna
 *       preference summary alongside it.
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         required: true
 *         schema: { type: string }
 *         example: 8c2e4f6a1b3d
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
 *                 data: { $ref: '#/components/schemas/UserDetailResponse' }
 *       401:
 *         description: Missing/invalid bearer token, or token role is not "admin"
 *         content:
 *           application/json:
 *             example: { status: 401, message: Unauthorized }
 *       404:
 *         description: No matching (non-deleted) user for that user_id
 *         content:
 *           application/json:
 *             example: { status: 404, message: Not Found }
 *       500:
 *         description: Unexpected error
 *         content:
 *           application/json:
 *             example: { status: 500, message: Something Went Wrong }
 */

/**
 * @swagger
 * /v1/users/status:
 *   patch:
 *     summary: Bulk-update the status of one or more users
 *     description: >
 *       Sets `status` on every non-deleted user in `user_ids` via
 *       updateMany. Unmatched ids are silently ignored — `updated` reports
 *       modifiedCount, which can be lower than user_ids.length.
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UserStatusUpdateRequest' }
 *     responses:
 *       200:
 *         description: Successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Updated Successfully }
 *                 data: { $ref: '#/components/schemas/UserStatusUpdateResult' }
 *       400:
 *         description: >
 *           Zod validation failure from validateBody (e.g. empty user_ids,
 *           or a status outside [active, inactive, suspended]). Message
 *           is every failing field's message joined with ", ".
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/UserErrorResponse' }
 *       401:
 *         description: Missing/invalid bearer token, or token role is not "admin"
 *         content:
 *           application/json:
 *             example: { status: 401, message: Unauthorized }
 *       500:
 *         description: Unexpected error
 *         content:
 *           application/json:
 *             example: { status: 500, message: Something Went Wrong }
 */

/**
 * @swagger
 * /v1/users/remove:
 *   post:
 *     summary: Bulk soft-delete users (reversible)
 *     description: >
 *       Named `removeUsers` in user.controller.ts / user.services.ts (NOT
 *       the "deleteUser" naming used by most other modules). Sets
 *       is_deleted: true via updateMany on every currently non-deleted
 *       user in user_ids; already-deleted or unmatched ids are silently
 *       skipped.
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UserBulkIdsRequest' }
 *     responses:
 *       200:
 *         description: Successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Deleted Successfully }
 *                 data: { $ref: '#/components/schemas/UserRemoveResult' }
 *       400:
 *         description: Zod validation failure (e.g. empty user_ids)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/UserErrorResponse' }
 *       401:
 *         description: Missing/invalid bearer token, or token role is not "admin"
 *         content:
 *           application/json:
 *             example: { status: 401, message: Unauthorized }
 *       500:
 *         description: Unexpected error
 *         content:
 *           application/json:
 *             example: { status: 500, message: Something Went Wrong }
 */

/**
 * @swagger
 * /v1/users/hard-delete:
 *   post:
 *     summary: Bulk permanently delete users (irreversible)
 *     description: >
 *       Named `hardRemoveUsers` in user.controller.ts / user.services.ts
 *       (NOT "hardDeleteUser"). Runs UserModel.deleteMany({ user_id: {
 *       $in: user_ids } }) with no is_deleted filter, so soft-deleted
 *       users are also eligible for hard delete. Does not cascade-delete
 *       the user's UserProfile or UserPreferences documents.
 *     tags: [Users]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/UserBulkIdsRequest' }
 *     responses:
 *       200:
 *         description: Successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Record Deleted Successfully }
 *                 data: { $ref: '#/components/schemas/UserHardRemoveResult' }
 *       400:
 *         description: Zod validation failure (e.g. empty user_ids)
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/UserErrorResponse' }
 *       401:
 *         description: Missing/invalid bearer token, or token role is not "admin"
 *         content:
 *           application/json:
 *             example: { status: 401, message: Unauthorized }
 *       500:
 *         description: Unexpected error
 *         content:
 *           application/json:
 *             example: { status: 500, message: Something Went Wrong }
 */
