import { Router } from "express";
import * as varientControllerModule from "./varient.controller";
import * as authMiddlewareModule from "../middlewares/auth.middleware";
import * as validateMiddlewareModule from "../middlewares/validate.middleware";
import * as varientSchemaModule from "../schemas/varient.schema";

const router = Router();
const {
    createVarient,
    updateVarient,
    deleteVarient,
    hardDeleteVarients,
    updateVarientsStatus,
    readVarient,
    getAllVarient,
} = varientControllerModule;
const { requireAuth } = authMiddlewareModule;
const { validateBody } = validateMiddlewareModule;
const {
    varientSchema,
    varientUpdateSchema,
    varientBulkIdsSchema,
    varientBulkStatusSchema,
} = varientSchemaModule;

router.post("/", requireAuth, validateBody(varientSchema), createVarient);
router.get("/", requireAuth, getAllVarient);
router.get("/details", requireAuth, readVarient);
router.patch("/", requireAuth, validateBody(varientUpdateSchema), updateVarient);
router.post("/", requireAuth, deleteVarient);
router.post("/hard-delete", requireAuth, validateBody(varientBulkIdsSchema), hardDeleteVarients);
router.patch("/status", requireAuth, validateBody(varientBulkStatusSchema), updateVarientsStatus);

export default router;
