import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import configModule from '../packages/config/index';
import * as constantsModule from '../packages/constants/index';
import routesModule from './routes/index';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import * as errorMiddlewareModule from './middlewares/error.middleware';
import * as notFoundMiddlewareModule from './middlewares/not-found.middleware';

const config = configModule;

const { CONSTANT } = constantsModule;
const routes = routesModule;
const errorMiddleware = errorMiddlewareModule.errorMiddleware;
const notFoundMiddleware = notFoundMiddlewareModule.notFoundMiddleware;

const app = express();

app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan("dev"));
app.use(rateLimit({
  windowMs: CONSTANT.RATE_LIMIT.WINDOW_MS,
  max: CONSTANT.RATE_LIMIT.MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "SVN admin_panel", version: "1.0.0" },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT token in the format: Bearer <token>",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/docs/*.js", "./src/docs/*.ts"],
});
app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: { defaultModelsExpandDepth: -1 },
  })
);

app.use(routes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
