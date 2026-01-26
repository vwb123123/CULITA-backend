import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validateBody } from "../middlewares/validation.middleware";
import { loginSchema, registerSchema } from "../schemas/auth.schema";

const authRoute = Router();
const authController = new AuthController();

authRoute.post("/register", validateBody(registerSchema), authController.register);
authRoute.post("/login", validateBody(loginSchema), authController.login);

export default authRoute;
