import * as handlersModule from '../../packages/handlers/index';
import * as constantsModule from '../../packages/constants/index';
import * as itemModelModule from './item.services';
import type { Request, Response } from 'express';

const { successHandler, errorHandler } = handlersModule;
const { CONSTANT } = constantsModule;
const { createItem, findItems, findItemById, updateItemById, deleteItemById } = itemModelModule;

export const create = async (req: Request, res: Response) => {
  const item = await createItem(req.body);
  successHandler({ status: 201, message: CONSTANT.PAYLOAD.RECORD_CREATED_SUCCESSFULLY, data: item }, req, res);
};

export const list = async (req: Request, res: Response) => {
  const items = await findItems();
  successHandler({ status: 200, message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY, data: items }, req, res);
};

export const getById = async (req: Request, res: Response) => {
  const item = await findItemById(String(req.params.id));
  if (!item) {
    return errorHandler({ status: 404, message: CONSTANT.STATUS.NOT_FOUND }, req, res);
  }
  successHandler({ status: 200, message: CONSTANT.PAYLOAD.RECORD_FETCHED_SUCCESSFULLY, data: item }, req, res);
};

export const update = async (req: Request, res: Response) => {
  const item = await updateItemById(String(req.params.id), req.body);
  if (!item) {
    return errorHandler({ status: 404, message: CONSTANT.STATUS.NOT_FOUND }, req, res);
  }
  successHandler({ status: 200, message: CONSTANT.PAYLOAD.RECORD_UPDATED_SUCCESSFULLY, data: item }, req, res);
};

export const remove = async (req: Request, res: Response) => {
  const item = await deleteItemById(String(req.params.id));
  if (!item) {
    return errorHandler({ status: 404, message: CONSTANT.STATUS.NOT_FOUND }, req, res);
  }
  successHandler({ status: 200, message: CONSTANT.PAYLOAD.RECORD_DELETED_SUCCESSFULLY, data: null }, req, res);
};
