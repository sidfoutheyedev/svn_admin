import { Router } from "express";
import * as analyticsControllerModule from "./analytics.controller";
import * as authMiddlewareModule from "../middlewares/auth.middleware";

const router = Router();
const { getStatsOverview, getRevenueOverview } = analyticsControllerModule;
const { requireAuth } = authMiddlewareModule;

router.get("/stats", getStatsOverview);
router.get("/revenue", getRevenueOverview);

export default router;
