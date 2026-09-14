import { Router } from "express";
import * as paymentControllerModule from "./payment.controller";
import * as authMiddlewareModule from "../middlewares/auth.middleware";
import * as validateMiddlewareModule from "../middlewares/validate.middleware";
import * as paymentSchemaModule from "../schemas/payment.schema";

const router = Router();
const {
    createPayment,
    readPayment,
    getAllPayments,
    updatePaymentsStatus,
    deletePayment,
    hardDeletePayments,
} = paymentControllerModule;
const { requireAuth } = authMiddlewareModule;
const { validateBody } = validateMiddlewareModule;
const { paymentCreateSchema, paymentBulkIdsSchema, paymentBulkStatusSchema } = paymentSchemaModule;

router.post("/", requireAuth, validateBody(paymentCreateSchema), createPayment);
router.get("/", requireAuth, getAllPayments);
router.get("/details", requireAuth, readPayment);
router.patch("/status", requireAuth, validateBody(paymentBulkStatusSchema), updatePaymentsStatus);
router.post("/", requireAuth, deletePayment);
router.post("/hard-delete", requireAuth, validateBody(paymentBulkIdsSchema), hardDeletePayments);

export default router;
