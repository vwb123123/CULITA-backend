import { Router } from "express";
import { AdminProductController } from "../controllers/admin.product.controller";
import { authenticateJwt } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/admin.middleware";
import { validateBody, validateParams } from "../middlewares/validation.middleware";
import { createProductSchema, updateProductSchema } from "../schemas/admin.product.schema";
import { productIdParamSchema } from "../schemas/product.schema";

const router = Router();
const adminProductController = new AdminProductController();

router.use(authenticateJwt, isAdmin);

router.post("/", validateBody(createProductSchema), adminProductController.createProduct);
router.put(
    "/:id",
    validateParams(productIdParamSchema),
    validateBody(updateProductSchema),
    adminProductController.updateProduct,
);
router.delete("/:id", validateParams(productIdParamSchema), adminProductController.deleteProduct);

export default router;
