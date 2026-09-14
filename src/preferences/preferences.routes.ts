import { Router } from "express";
import * as preferencesControllerModule from "./preferences.controller";
import * as authMiddlewareModule from "../middlewares/auth.middleware";
import * as validateMiddlewareModule from "../middlewares/validate.middleware";
import * as preferencesSchemaModule from "../schemas/preferences.schema";

const router = Router();
const {
  getPreferencescontroller,
  createPreferencesController,
  updatePreferencesController,
  deletePreferencesController,
  getPreferencesByIdController,
  updateMultiplePreferencesController,
} = preferencesControllerModule;
const { requireAuth } = authMiddlewareModule;
const { validateBody } = validateMiddlewareModule;
const { preferencesCreateSchema, preferencesUpdateSchema, preferencesBulkStatusSchema } = preferencesSchemaModule;

router.get("/", requireAuth, getPreferencescontroller);

router.get("/details", requireAuth, getPreferencesByIdController);

router.post(
  "/",
  requireAuth,
  validateBody(preferencesCreateSchema),
  createPreferencesController,
);

router.patch(
  "/",
  requireAuth,
  validateBody(preferencesUpdateSchema),
  updatePreferencesController,
);

router.post("/", requireAuth, deletePreferencesController);
router.patch(
  "/status",
  requireAuth,
  validateBody(preferencesBulkStatusSchema),
  updateMultiplePreferencesController,
);

export default router;
