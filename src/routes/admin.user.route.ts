import { Router } from "express";
import { AdminUserController } from "../controllers/admin.user.controller";
import { isAdmin } from "../middlewares/admin.middleware";
import { authenticateJwt } from "../middlewares/auth.middleware";
import { validateBody, validateParams, validateQuery } from "../middlewares/validation.middleware";
import {
    createUserSchema,
    paginationQuerySchema,
    updateUserSchema,
    userIdParamSchema,
} from "../schemas/admin.user.schema";

const router = Router();
const adminUserController = new AdminUserController();

router.use(authenticateJwt, isAdmin);

router.get("/", validateQuery(paginationQuerySchema), adminUserController.getUsers);
router.get("/:id", validateParams(userIdParamSchema), adminUserController.getUser);
router.post("/", validateBody(createUserSchema), adminUserController.createUser);
router.put(
    "/:id",
    validateParams(userIdParamSchema),
    validateBody(updateUserSchema),
    adminUserController.updateUser,
);
router.delete("/:id", validateParams(userIdParamSchema), adminUserController.deleteUser);

export default router;
