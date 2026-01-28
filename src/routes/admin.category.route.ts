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
    "/",
    validateBody(createCategorySchema),
    adminCategoryController.createCategory,
);
router.put(
    "/:id",
    validateParams(categoryIdParamSchema),
    validateBody(updateCategorySchema),
    adminCategoryController.updateCategory,
);
router.delete(
    "/:id",
    validateParams(categoryIdParamSchema),
    adminCategoryController.deleteCategory,
);

export default router;
