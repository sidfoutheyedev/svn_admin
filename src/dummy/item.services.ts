import { ItemModel } from "../models/item.model";
export const createItem = (data: any) => ItemModel.create(data);
export const findItems = () => ItemModel.find().sort({ createdAt: -1 });
export const findItemById = (id: string) => ItemModel.findById(id).catch(() => null);
export const updateItemById = (id: string, data: any) => ItemModel.findByIdAndUpdate(id, data, { new: true, runValidators: true }).catch(() => null);
export const deleteItemById = (id: string) => ItemModel.findByIdAndDelete(id).catch(() => null);
