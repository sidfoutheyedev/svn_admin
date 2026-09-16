import { Router } from "express";
import * as analyticsControllerModule from "./analytics.controller";
import * as authMiddlewareModule from "../middlewares/auth.middleware";

const router = Router();
const { getStatsOverview, getRevenueOverview, getTopperformerproducts } = analyticsControllerModule;
const { requireAuth } = authMiddlewareModule;

router.get("/stats",  getStatsOverview);
router.get("/revenue", getRevenueOverview);
router.get("/top-performer", getTopperformerproducts)
export default router;
