import { Router } from "express";
import { UserOrderController } from "../controllers/order.controller";
import { authenticateJwt } from "../middlewares/auth.middleware";
import { validateBody, validateParams, validateQuery } from "../middlewares/validation.middleware";
import {
    createOrderSchema,
    confirmOrderSchema,
    getOrderListQuerySchema,
    orderIdParamSchema,
    returnOrderSchema,
} from "../schemas/order.schema";

const router = Router();
const orderController = new UserOrderController();

// 모든 주문 API는 로그인이 필요함
router.use(authenticateJwt);

router.post("/checkout", validateBody(createOrderSchema), orderController.checkout);
router.post("/confirm", validateBody(confirmOrderSchema), orderController.confirm);
router.get("/", validateQuery(getOrderListQuerySchema), orderController.getMyOrders);
router.get("/:id", validateParams(orderIdParamSchema), orderController.getOrderDetail);
router.post("/:id/cancel", validateParams(orderIdParamSchema), orderController.cancelOrder);
router.post(
    "/:id/return",
    validateParams(orderIdParamSchema),
    validateBody(returnOrderSchema),
    orderController.requestReturn,
);

export default router;
