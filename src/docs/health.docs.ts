/**
 * @swagger
 * tags:
 *   name: Health
 *   description: Service liveness check endpoint used to verify the API is up and responding.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     HealthCheckResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: integer
 *           example: 200
 *         message:
 *           type: string
 *           example: Successful
 *         data:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               example: ok
 */

/**
 * @swagger
 * /v1/health:
 *   get:
 *     summary: Check service health
 *     description: Returns a simple ok status confirming the API is running. Does not require authentication.
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheckResponse'
 */
