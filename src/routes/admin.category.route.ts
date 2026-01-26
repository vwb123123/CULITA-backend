import { Router } from "express";
import { AdminCategoryController } from "../controllers/admin.category.controller";
import { authenticateJwt } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/admin.middleware";
import { validateBody, validateParams } from "../middlewares/validation.middleware";
import {
    createCategorySchema,
    updateCategorySchema,
    categoryIdParamSchema,
} from "../schemas/admin.category.schema";

const router = Router();
const adminCategoryController = new AdminCategoryController();

router.use(authenticateJwt, isAdmin);

router.post(
    "/categories",
    validateBody(createCategorySchema),
    adminCategoryController.createCategory,
);
router.put(
    "/categories/:id",
    validateParams(categoryIdParamSchema),
    validateBody(updateCategorySchema),
    adminCategoryController.updateCategory,
);
router.delete(
    "/categories/:id",
    validateParams(categoryIdParamSchema),
    adminCategoryController.deleteCategory,
);

export default router;
