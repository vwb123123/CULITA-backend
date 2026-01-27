import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { validateParams, validateQuery } from "../middlewares/validation.middleware";
import { productListQuerySchema, productIdParamSchema } from "../schemas/product.schema";

const router = Router();
const productController = new ProductController();

router.get("/", validateQuery(productListQuerySchema), productController.getProducts);
router.get("/:id", validateParams(productIdParamSchema), productController.getProduct);

export default router;
