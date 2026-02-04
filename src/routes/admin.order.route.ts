import { Router } from "express";
import { AdminOrderController } from "../controllers/admin.order.controller";
import { authenticateJwt } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/admin.middleware";
import { validateQuery, validateParams, validateBody } from "../middlewares/validation.middleware";
import {
    getAdminOrderListQuerySchema,
    adminOrderIdParamSchema,
    updateOrderStatusSchema,
} from "../schemas/admin.order.schema";

const router = Router();
const adminOrderController = new AdminOrderController();

// 모든 관리자 주문 API는 '로그인 + 관리자 권한' 필수
router.use(authenticateJwt, isAdmin);

router.get("/", validateQuery(getAdminOrderListQuerySchema), adminOrderController.getAllOrders);
router.get("/:id", validateParams(adminOrderIdParamSchema), adminOrderController.getOrderDetail);
router.patch(
    "/:id/status",
    validateParams(adminOrderIdParamSchema),
    validateBody(updateOrderStatusSchema),
    adminOrderController.updateStatus,
);

export default router;
