import { Router } from "express";
import * as userControllerModule from "./user.controller";
import * as authMiddlewareModule from "../middlewares/auth.middleware";
import * as validateMiddlewareModule from "../middlewares/validate.middleware";
import * as userSchemaModule from "../schemas/user.schema";

const router = Router();
const { getAllUsers, getUserDetails, updateUserStatus, removeUsers, hardRemoveUsers } = userControllerModule;
const { requireAuth } = authMiddlewareModule;
const { validateBody } = validateMiddlewareModule;
const { userStatusSchema, userRemoveSchema } = userSchemaModule;

router.get("/", requireAuth, getAllUsers);
router.get("/details", requireAuth, getUserDetails);
router.patch("/status", requireAuth, validateBody(userStatusSchema), updateUserStatus);
router.post("/remove", requireAuth, validateBody(userRemoveSchema), removeUsers);
router.post("/hard-delete", requireAuth, validateBody(userRemoveSchema), hardRemoveUsers);
export default router;
