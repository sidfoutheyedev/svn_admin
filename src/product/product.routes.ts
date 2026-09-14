import { Router } from "express";
import {
  createProductcontroller,
  updateProductcontroller,
  readProductcontroller,
  readallProductcontroller,
  deleteSingleorMultiProductcontroller,
  softDeleteProductcontroller,
  createproductVarientcontroller,
  updateProductVarientcontroller,
  deleteproductVarientcontroller,
  softDeleteProductVarientcontroller,
  getallProductVarientcontroller,
  updateManyProductStatusController,
  sampleProductCSVcontroller,
  createProductByCSVcontroller,
  getallProductByCSVcontroller,
} from "./product.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validate.middleware";
import { uploadCsvSingle } from "../middlewares/upload.middleware";
import {
  productSchema,
  productUpdateSchema,
  productVariantInputSchema,
  productVariantUpdateSchema,
  productBulkIdsSchema,
  productBulkStatusSchema,
  productVariantBulkIdsSchema,
} from "../schemas/product.schema";

const router = Router();

router.post(
  "/",
  requireAuth,
  validateBody(productSchema),
  createProductcontroller,
);
router.get("/", requireAuth, readallProductcontroller);
router.get("/details", requireAuth, readProductcontroller);
router.patch(
  "/",
  requireAuth,
  validateBody(productUpdateSchema),
  updateProductcontroller,
);
router.post(
  "/hard-delete",
  requireAuth,
  validateBody(productBulkIdsSchema),
  deleteSingleorMultiProductcontroller,
);
router.post(
  "/soft-delete",
  requireAuth,
  validateBody(productBulkIdsSchema),
  softDeleteProductcontroller,
);
router.patch(
  "/status",
  requireAuth,
  validateBody(productBulkStatusSchema),
  updateManyProductStatusController,
);


// varient routes call 

router.post(
  "/variants",
  requireAuth,
  validateBody(productVariantInputSchema),
  createproductVarientcontroller,
);
router.get("/variants", requireAuth, getallProductVarientcontroller);
router.patch(
  "/variants",
  requireAuth,
  validateBody(productVariantUpdateSchema),
  updateProductVarientcontroller,
);
router.post(
  "/variants/hard-delete",
  requireAuth,
  validateBody(productVariantBulkIdsSchema),
  deleteproductVarientcontroller,
);
router.post(
  "/variants/soft-delete",
  requireAuth,
  validateBody(productVariantBulkIdsSchema),
  softDeleteProductVarientcontroller,
);

router.get("/csv/sample", requireAuth, sampleProductCSVcontroller);
router.post("/csv", requireAuth, uploadCsvSingle("file"), createProductByCSVcontroller);
router.get("/csv", requireAuth, getallProductByCSVcontroller);

export default router;
