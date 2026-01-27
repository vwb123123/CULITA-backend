import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticateJwt } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validation.middleware";
import { changePasswordSchema, updateProfileSchema } from "../schemas/user.schema";

const router = Router();
const userController = new UserController();

router.use(authenticateJwt);

router.put("/me", validateBody(updateProfileSchema), userController.updateProfile);
router.patch("/me/password", validateBody(changePasswordSchema), userController.changePassword);

export default router;
