import { Router } from "express";
import * as healthControllerModule from "./health.controller";

const router = Router();
const { healthCheck } = healthControllerModule;
router.get("/", healthCheck);

export default router;
