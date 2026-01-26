import { Router } from "express";
import { CartController } from "../controllers/cart.controller";
import { authenticateJwt } from "../middlewares/auth.middleware";
import { validateBody, validateParams } from "../middlewares/validation.middleware";
import {
    addToCartSchema,
    cartItemIdParamSchema,
    updateCartItemSchema,
} from "../schemas/cart.schema";

const router = Router();
const cartController = new CartController();

router.use(authenticateJwt);

router.get("/", cartController.getCart);
router.post("/", validateBody(addToCartSchema), cartController.addToCart);
router.put(
    "/items/:itemId",
    validateParams(cartItemIdParamSchema),
    validateBody(updateCartItemSchema),
    cartController.updateItem,
);
router.delete("/items/:itemId", validateParams(cartItemIdParamSchema), cartController.removeItem);

export default router;
