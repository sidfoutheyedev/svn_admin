import { Router } from "express";
import * as refundControllerModule from "./refund.controller";
import * as authMiddlewareModule from "../middlewares/auth.middleware";
import * as validateMiddlewareModule from "../middlewares/validate.middleware";
import * as refundSchemaModule from "../schemas/refund.schema";

const router = Router();
const {
  createRefund,
  readRefund,
  getAllRefunds,
  updateRefundsStatus,
  deleteRefund,
  hardDeleteRefunds,
} = refundControllerModule;
const { requireAuth } = authMiddlewareModule;
const { validateBody } = validateMiddlewareModule;
const { refundCreateSchema, refundBulkIdsSchema, refundBulkStatusSchema } =
  refundSchemaModule;

router.post("/", requireAuth, validateBody(refundCreateSchema), createRefund);
router.get("/", requireAuth, getAllRefunds);
router.get("/details", requireAuth, readRefund);
router.patch(
  "/status",
  requireAuth,
  validateBody(refundBulkStatusSchema),
  updateRefundsStatus,
);
router.post("/", requireAuth, deleteRefund);
router.post(
  "/hard-delete",
  requireAuth,
  validateBody(refundBulkIdsSchema),
  hardDeleteRefunds,
);

export default router;
