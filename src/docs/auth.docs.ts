/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: >
 *     Local email/password registration and login, Firebase-backed social
 *     sign-in (Google/Apple), and admin-only password reset / logout —
 *     issues and consumes the bearerAuth JWT used by every other module.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AuthCredentialsRequest:
 *       type: object
 *       description: >
 *         Shared shape for /register and /login — both routes validate
 *         against the exact same Zod schema (authSchema).
 *       required: [email, password]
 *       properties:
 *         email: { type: string, format: email, example: admin@svn.com }
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           example: admin@SVN123
 *     AuthSocialLoginRequest:
 *       type: object
 *       required: [idToken, provider]
 *       properties:
 *         idToken:
 *           type: string
 *           minLength: 1
 *           description: Firebase ID token obtained on-device after Google/Apple sign-in.
 *         provider:
 *           type: string
 *           enum: [google, apple]
 *           description: >
 *             Must match the token's Firebase sign_in_provider
 *             (google -> google.com, apple -> apple.com) or the request is
 *             rejected with 400.
 *     AuthResetPasswordRequest:
 *       type: object
 *       required: [password, confirm_password]
 *       properties:
 *         password: { type: string, format: password, minLength: 8 }
 *         confirm_password: { type: string, format: password, minLength: 8 }
 *     AuthRegisterResponse:
 *       type: object
 *       description: Shape returned by registerServices — no token is issued on registration.
 *       properties:
 *         user_id: { type: string, example: 5f3a1b9c02d4 }
 *         email: { type: string, example: admin@svn.com }
 *         role: { type: string, enum: [admin, user], example: user }
 *     AuthLoginResponse:
 *       type: object
 *       properties:
 *         user_id: { type: string, example: 5f3a1b9c02d4 }
 *         email: { type: string, example: admin@svn.com }
 *         role: { type: string, enum: [admin, user], example: admin }
 *         token:
 *           type: string
 *           description: JWT signed with { user_id, email, role }, expires in 1 day.
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     AuthSocialLoginUser:
 *       type: object
 *       description: >
 *         Raw User mongoose document (password excluded — the field is
 *         select:false and never explicitly re-selected here).
 *       properties:
 *         _id: { type: string }
 *         user_id: { type: string, example: 8c2e4f6a1b3d }
 *         email: { type: string, example: jane@gmail.com }
 *         role: { type: string, enum: [admin, user], example: user }
 *         provider: { type: string, enum: [local, google, apple], example: google }
 *         firebaseUid: { type: string, example: "kY7z...uid" }
 *         lastLogin: { type: string, format: date-time, nullable: true }
 *         status: { type: string, enum: [active, inactive, suspended], example: active }
 *         is_deleted: { type: boolean, example: false }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *     AuthSocialLoginResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: >
 *             JWT signed with { user_id, email, role } from the (possibly
 *             newly created) user. New signups always get role "user".
 *         user: { $ref: '#/components/schemas/AuthSocialLoginUser' }
 *     AuthResetPasswordResult:
 *       type: object
 *       description: >
 *         **Important**: the controller never inspects this service result
 *         before responding — resetPassword always sends HTTP 200 with this
 *         object nested under the top-level `data`. Callers must read
 *         `data.status` / `data.message` to know whether the reset actually
 *         succeeded; on success there is no extra payload beyond status/message.
 *       properties:
 *         status: { type: integer, example: 200 }
 *         message: { type: string, example: Successful }
 *     AuthLogoutResult:
 *       type: object
 *       description: >
 *         Same wrapping quirk as AuthResetPasswordResult — logout always
 *         responds HTTP 200 with this object nested under `data`; check
 *         `data.status` for the real outcome. Logout only bumps `lastLogin`,
 *         it does not blacklist or invalidate the JWT (tokens remain valid
 *         until they naturally expire after 1 day).
 *       properties:
 *         status: { type: integer, example: 200 }
 *         message: { type: string, example: Successful }
 *         user_id: { type: string, example: 5f3a1b9c02d4 }
 *     AuthErrorResponse:
 *       type: object
 *       properties:
 *         status: { type: integer, example: 400 }
 *         message: { type: string, example: Invalid email }
 */

/**
 * @swagger
 * /v1/auth/register:
 *   post:
 *     summary: Register a new local (email/password) account
 *     description: >
 *       Rejects with 409 if the email is already registered. Password is
 *       hashed with bcrypt (cost 10) before storage. The created user
 *       always gets provider "local" and defaults to role "user" — no
 *       token is issued, the caller must log in separately.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AuthCredentialsRequest' }
 *     responses:
 *       201:
 *         description: Account created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 201 }
 *                 message: { type: string, example: Record Created Successfully }
 *                 data: { $ref: '#/components/schemas/AuthRegisterResponse' }
 *       400:
 *         description: >
 *           Zod validation failure (e.g. invalid email format or password
 *           under 8 characters). Message is every failing field's message
 *           joined with ", ".
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthErrorResponse' }
 *             example: { status: 400, message: "Invalid email, String must contain at least 8 character(s)" }
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             example: { status: 409, message: Record Already Exists }
 *       500:
 *         description: Unexpected error (e.g. a duplicate-key race on user_id/email)
 *         content:
 *           application/json:
 *             example: { status: 500, message: Something Went Wrong }
 */

/**
 * @swagger
 * /v1/auth/login:
 *   post:
 *     summary: Log in with email and password
 *     description: >
 *       Looks the user up by email and compares the given password against
 *       the stored bcrypt hash. A social-only account (no password set)
 *       always fails the comparison and responds 401.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AuthCredentialsRequest' }
 *     responses:
 *       200:
 *         description: Login succeeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Successful }
 *                 data: { $ref: '#/components/schemas/AuthLoginResponse' }
 *       400:
 *         description: >
 *           Zod validation failure from validateBody (same schema/messages
 *           as /register). The controller also has a redundant
 *           "Email and password are required" check that the schema
 *           already makes unreachable in practice.
 *         content:
 *           application/json:
 *             example: { status: 400, message: "Invalid email, String must contain at least 8 character(s)" }
 *       401:
 *         description: Password does not match
 *         content:
 *           application/json:
 *             example: { status: 401, message: Unauthorized }
 *       404:
 *         description: No user with that email
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
 * /v1/auth/social:
 *   post:
 *     summary: Sign up or log in with Google or Apple via Firebase Auth
 *     description: >
 *       Verifies the Firebase ID token, then resolves the user by
 *       firebaseUid first and falls back to matching by email. If no user
 *       exists one is created (provider set to the given value, role
 *       defaults to "user"); if a local user is found without a linked
 *       firebaseUid, this call links it in place (sets firebaseUid and
 *       provider on the existing account) rather than creating a
 *       duplicate. lastLogin is updated either way and a fresh JWT is
 *       issued from the resulting user's { user_id, email, role }.
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AuthSocialLoginRequest' }
 *     responses:
 *       200:
 *         description: Social login succeeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Social Login Successful }
 *                 data: { $ref: '#/components/schemas/AuthSocialLoginResponse' }
 *       400:
 *         description: >
 *           Zod validation failure, or the token's actual
 *           firebase.sign_in_provider does not match the requested
 *           `provider`.
 *         content:
 *           application/json:
 *             example: { status: 400, message: "Token provider does not match requested provider" }
 *       401:
 *         description: idToken failed Firebase verification (invalid, malformed, or expired)
 *         content:
 *           application/json:
 *             example: { status: 401, message: "Invalid or expired social login token" }
 *       422:
 *         description: Token verified but carries no email claim (e.g. Apple re-auth without email scope)
 *         content:
 *           application/json:
 *             example: { status: 422, message: "Unable to retrieve email from social provider" }
 *       500:
 *         description: Unexpected error (e.g. a duplicate-key race on firebaseUid)
 *         content:
 *           application/json:
 *             example: { status: 500, message: Something Went Wrong }
 */

/**
 * @swagger
 * /v1/auth/reset-password:
 *   post:
 *     summary: Reset the authenticated user's password
 *     description: >
 *       requireAuth only accepts a bearer JWT whose decoded payload has
 *       role "admin" — a token for a default "user"-role account is
 *       rejected with 401 before this handler ever runs, even though the
 *       token itself is valid. **The handler itself does not check the
 *       service result before responding**: it always sends HTTP 200 with
 *       the real outcome nested inside `data` (see AuthResetPasswordResult)
 *       — a mismatch or a not-found user still comes back as HTTP 200 with
 *       `data.status` 400/404 respectively. Only a missing/invalid token
 *       (caught by requireAuth) or an uncaught exception produce a
 *       non-200 top-level status.
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/AuthResetPasswordRequest' }
 *     responses:
 *       200:
 *         description: >
 *           Always returned once requireAuth passes. Inspect the nested
 *           `data` object for the real outcome.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Successful }
 *                 data: { $ref: '#/components/schemas/AuthResetPasswordResult' }
 *             examples:
 *               passwordUpdated:
 *                 summary: Reset succeeded
 *                 value: { status: 200, message: Successful, data: { status: 200, message: Successful } }
 *               passwordsDoNotMatch:
 *                 summary: password !== confirm_password (nested data.status is 400)
 *                 value: { status: 200, message: Successful, data: { status: 400, message: "Password and confirm password do not match" } }
 *               userNotFound:
 *                 summary: Token's user_id no longer exists (nested data.status is 404)
 *                 value: { status: 200, message: Successful, data: { status: 404, message: Not Found } }
 *       400:
 *         description: Zod validation failure (password or confirm_password under 8 characters)
 *         content:
 *           application/json:
 *             example: { status: 400, message: "String must contain at least 8 character(s)" }
 *       401:
 *         description: Missing bearer token, invalid/expired token, or a valid token whose role is not "admin"
 *         content:
 *           application/json:
 *             example: { status: 401, message: Unauthorized }
 */

/**
 * @swagger
 * /v1/auth/logout:
 *   post:
 *     summary: Log out the authenticated user
 *     description: >
 *       requireAuth restricts this route to bearer tokens whose decoded
 *       role is "admin", same as /reset-password. Logout only stamps
 *       lastLogin — it does not blacklist or otherwise invalidate the JWT,
 *       which stays valid until it expires 1 day after issuance. As with
 *       /reset-password, **the controller does not check the service
 *       result**: it always sends HTTP 200 with the outcome nested inside
 *       `data` (see AuthLogoutResult) — a not-found user still comes back
 *       as HTTP 200 with `data.status` 404.
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: >
 *           Always returned once requireAuth passes. Inspect the nested
 *           `data` object for the real outcome.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: integer, example: 200 }
 *                 message: { type: string, example: Successful }
 *                 data: { $ref: '#/components/schemas/AuthLogoutResult' }
 *             examples:
 *               loggedOut:
 *                 summary: lastLogin updated successfully
 *                 value: { status: 200, message: Successful, data: { status: 200, message: Successful, user_id: 5f3a1b9c02d4 } }
 *               userNotFound:
 *                 summary: Token's user_id no longer exists (nested data.status is 404)
 *                 value: { status: 200, message: Successful, data: { status: 404, message: Not Found } }
 *       401:
 *         description: Missing bearer token, invalid/expired token, or a valid token whose role is not "admin"
 *         content:
 *           application/json:
 *             example: { status: 401, message: Unauthorized }
 */
