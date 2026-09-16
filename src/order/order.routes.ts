import { Router } from "express";
import * as orderControllerModule from "./order.controller";
import * as authMiddlewareModule from "../middlewares/auth.middleware";
import * as validateMiddlewareModule from "../middlewares/validate.middleware";
import * as orderSchemaModule from "../schemas/order.schema";

const router = Router();
const {
    createOrder,
    readOrder,
    getAllOrders,
    updateOrdersStatus,
    deleteOrder,
    hardDeleteOrders,
} = orderControllerModule;
const { requireAuth } = authMiddlewareModule;
const { validateBody } = validateMiddlewareModule;
const { orderCreateSchema, orderBulkIdsSchema, orderBulkStatusSchema } = orderSchemaModule;

router.post("/", requireAuth, validateBody(orderCreateSchema), createOrder);
router.get("/", requireAuth, getAllOrders);
router.get("/details", requireAuth, readOrder);
router.patch("/status", requireAuth, validateBody(orderBulkStatusSchema), updateOrdersStatus);
router.post("/soft-delete", requireAuth, validateBody(orderBulkIdsSchema), deleteOrder);
router.post("/hard-delete", requireAuth, validateBody(orderBulkIdsSchema), hardDeleteOrders);

export default router;
