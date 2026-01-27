import { Router } from "express";
import { AdminProductController } from "../controllers/admin.product.controller";
import { authenticateJwt } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/admin.middleware";
import { upload } from "../middlewares/upload.middleware";
import { validateBody, validateParams } from "../middlewares/validation.middleware";
import { createProductSchema, updateProductSchema } from "../schemas/admin.product.schema";
import { productIdParamSchema } from "../schemas/product.schema"; // ID 파라미터 스키마 재사용

const router = Router();
const adminProductController = new AdminProductController();

router.use(authenticateJwt, isAdmin);

router.post(
    "/",
    upload.array("images", 10),
    validateBody(createProductSchema),
    adminProductController.createProduct,
);
router.put(
    "/:id",
    validateParams(productIdParamSchema),
    validateBody(updateProductSchema),
    adminProductController.updateProduct,
);
router.delete("/:id", validateParams(productIdParamSchema), adminProductController.deleteProduct);

export default router;
