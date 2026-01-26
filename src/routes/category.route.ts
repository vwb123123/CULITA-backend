import { Router } from "express";
import { CategoryController } from "../controllers/category.controller";
import { validateParams } from "../middlewares/validation.middleware";
import { categoryPathParamSchema } from "../schemas/category.schema";

const router = Router();
const categoryController = new CategoryController();

router.get("/", categoryController.getAllCategories);
router.get("/:path", validateParams(categoryPathParamSchema), categoryController.getCategoryByPath);

export default router;
