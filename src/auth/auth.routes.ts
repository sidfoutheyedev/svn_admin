import { Router } from 'express';
import * as authControllerModule from './auth.controller';
import * as validateMiddlewareModule from '../middlewares/validate.middleware';
import * as authMiddlewareModule from '../middlewares/auth.middleware';
import * as authSchemaModule from '../schemas/auth.schema';

const router = Router();
const { register, login, social, resetPassword, Userlogout } = authControllerModule;
const { validateBody } = validateMiddlewareModule;
const { requireAuth } = authMiddlewareModule;
const { authSchema, socialAuthSchema, resetPasswordSchema } = authSchemaModule;
router.post('/register', validateBody(authSchema),register);
router.post('/login', validateBody(authSchema), login);
router.post('/social', validateBody(socialAuthSchema), social);
router.post('/reset-password', requireAuth, validateBody(resetPasswordSchema), resetPassword );
router.post('/logout', requireAuth, Userlogout)

export default router;
