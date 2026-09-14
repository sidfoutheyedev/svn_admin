import { Router } from "express";
import * as inventoryControllerModule from "./inventory.controller";
import * as authMiddlewareModule from "../middlewares/auth.middleware";

const router = Router();
const { getVariantStock, listInventory, listMovements } = inventoryControllerModule;
const { requireAuth } = authMiddlewareModule;

router.get("/", requireAuth, listInventory);
router.get("/stock", requireAuth, getVariantStock);
router.get("/movements", requireAuth, listMovements);

export default router;
