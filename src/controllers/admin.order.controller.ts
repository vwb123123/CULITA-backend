import { Request, Response, NextFunction } from "express";
import { AdminOrderService } from "../services/admin.order.service";

const adminOrderService = new AdminOrderService();

export class AdminOrderController {
    // 전체 주문 조회
    async getAllOrders(req: Request, res: Response, next: NextFunction) {
        try {
            const query = req.query as any;
            const result = await adminOrderService.getAllOrders(query);
            res.status(200).json({ message: "조회 성공", data: result });
        } catch (error) {
            next(error);
        }
    }

    // 주문 상세 조회
    async getOrderDetail(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            const result = await adminOrderService.getOrderDetail(id);
            res.status(200).json({ message: "상세 조회 성공", data: result });
        } catch (error) {
            next(error);
        }
    }

    // 주문 상태 변경
    async updateStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            const result = await adminOrderService.updateOrderStatus(id, req.body);
            res.status(200).json({ message: "상태 변경 성공", data: result });
        } catch (error) {
            next(error);
        }
    }
}
