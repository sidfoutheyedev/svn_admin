import { Router } from "express";
import * as categoryControllerModule from "./category.controller";
import * as authMiddlewareModule from "../middlewares/auth.middleware";
import * as validateMiddlewareModule from "../middlewares/validate.middleware";
import * as categorySchemaModule from "../schemas/category.schema";

const router = Router();
const {
    createCategory,
    updateCategory,
    deleteCategory,
    hardDeleteCategories,
    updateCategoriesStatus,
    readCategory,
    getAllCategory,
} = categoryControllerModule;
const { requireAuth } = authMiddlewareModule;
const { validateBody } = validateMiddlewareModule;
const {
    categorySchema,
    categoryUpdateSchema,
    categoryBulkIdsSchema,
    categoryBulkStatusSchema,
} = categorySchemaModule;

router.post("/", requireAuth, validateBody(categorySchema), createCategory);
router.get("/", requireAuth, getAllCategory);
router.get("/details", requireAuth, readCategory);
router.patch("/", requireAuth, validateBody(categoryUpdateSchema), updateCategory);
router.post("/", requireAuth, deleteCategory);
router.post("/hard-delete", requireAuth, validateBody(categoryBulkIdsSchema), hardDeleteCategories);
router.patch("/status", requireAuth, validateBody(categoryBulkStatusSchema), updateCategoriesStatus);

export default router;
