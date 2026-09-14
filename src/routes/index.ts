import { Router } from "express";
import healthRoutesModule from "../health/health.routes";

import itemRoutesModule from "../dummy/item.routes";
import authRoutesModule from "../auth/auth.routes";
import categoryRoutesModule from "../category/category.routes";
import brandRoutesModule from "../brand/brand.routes";
import varientRoutesModule from "../varient/varient.routes";
import userRoutesModule from "../user/user.routes";
import paymentRoutesModule from "../payment/payment.routes";
import productRoutesModule from "../product/product.routes";
import inventoryRoutesModule from "../inventory/inventory.routes";
import orderRoutesModule from "../order/order.routes";
import refundRoutesModule from "../refund/refund.routes";
import analyticsRoutesModule from "../analytics/analytics.routes";
import preferencesRoutesModule from "../preferences/preferences.routes";

const router = Router();
const healthRoutes = healthRoutesModule;
const itemRoutes = itemRoutesModule;
const authRoutes = authRoutesModule;
const categoryRoutes = categoryRoutesModule;
const brandRoutes = brandRoutesModule;
const varientRoutes = varientRoutesModule;
const userRoutes = userRoutesModule;
const paymentRoutes = paymentRoutesModule;
const productRoutes = productRoutesModule;
const inventoryRoutes = inventoryRoutesModule;
const orderRoutes = orderRoutesModule;
const refundRoutes = refundRoutesModule;
const analyticsRoutes = analyticsRoutesModule;
const preferencesRoutes = preferencesRoutesModule;



router.use("/v1/health", healthRoutes);
router.use("/v1/items", itemRoutes);
router.use("/v1/auth", authRoutes);
router.use("/v1/categories", categoryRoutes);
router.use("/v1/brands", brandRoutes);
router.use("/v1/varients", varientRoutes);
router.use("/v1/users", userRoutes);
router.use("/v1/payments", paymentRoutes);
router.use("/v1/products", productRoutes);
router.use("/v1/inventory", inventoryRoutes);
router.use("/v1/orders", orderRoutes);
router.use("/v1/refunds", refundRoutes);
router.use("/v1/analytics", analyticsRoutes);
router.use("/v1/preferences", preferencesRoutes);

export default router;
