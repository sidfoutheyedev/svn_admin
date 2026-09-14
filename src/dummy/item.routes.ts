import { Router } from 'express';
import * as itemControllerModule from './item.controller';
import * as authMiddlewareModule from '../middlewares/auth.middleware';
import * as validateMiddlewareModule from '../middlewares/validate.middleware';
import * as itemSchemaModule from '../schemas/item.schema';

const router = Router();
const { create, list, getById, update, remove } = itemControllerModule;

const { validateBody } = validateMiddlewareModule;
const { itemSchema, itemUpdateSchema } = itemSchemaModule;
router.post('/',  validateBody(itemSchema), create);
router.get('/',  list);
router.get('/:id',  getById);
router.patch('/:id',  validateBody(itemUpdateSchema), update);
router.delete('/:id',  remove);

export default router;
