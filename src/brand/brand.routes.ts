import { Router } from "express";
import * as brandControllerModule from "./brand.controller";
import * as authMiddlewareModule from "../middlewares/auth.middleware";
import * as validateMiddlewareModule from "../middlewares/validate.middleware";
import * as brandSchemaModule from "../schemas/brand.schema";

const router = Router();
const {
    createBrand,
    updateBrand,
    deleteBrand,
    hardDeleteBrands,
    updateBrandsStatus,
    readBrand,
    getAllBrand,
} = brandControllerModule;
const { requireAuth } = authMiddlewareModule;
const { validateBody } = validateMiddlewareModule;
const { brandSchema, brandUpdateSchema, brandBulkIdsSchema, brandBulkStatusSchema } = brandSchemaModule;

router.post("/", requireAuth, validateBody(brandSchema), createBrand);
router.get("/", requireAuth, getAllBrand);
router.get("/details", requireAuth, readBrand);
router.patch("/", requireAuth, validateBody(brandUpdateSchema), updateBrand);
router.post("/soft-delete", requireAuth, validateBody(brandBulkIdsSchema), deleteBrand);
router.post("/hard-delete", requireAuth, validateBody(brandBulkIdsSchema), hardDeleteBrands);
router.patch("/status", requireAuth, validateBody(brandBulkStatusSchema), updateBrandsStatus);

export default router;
