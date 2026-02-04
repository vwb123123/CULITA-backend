import { Request, Response, NextFunction } from "express";
import { UserOrderService } from "../services/order.service";
import { GetOrderListQuery } from "../schemas/order.schema";

const orderService = new UserOrderService();

export class UserOrderController {
    // 주문서 작성
    async checkout(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await orderService.createOrder(req.user!.id, req.body);
            res.status(201).json({ message: "주문서 생성 완료", data: result });
        } catch (error) {
            next(error);
        }
    }

    // 결제 승인
    async confirm(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await orderService.confirmOrder(req.user!.id, req.body);
            res.status(200).json({ message: "주문 및 결제 완료", data: result });
        } catch (error) {
            next(error);
        }
    }

    // 주문 목록 조회
    async getMyOrders(req: Request, res: Response, next: NextFunction) {
        try {
            const query = req.query as unknown as GetOrderListQuery;
            const result = await orderService.getMyOrders(req.user!.id, query);
            res.status(200).json({ message: "조회 성공", data: result });
        } catch (error) {
            next(error);
        }
    }

    // 주문 상세 조회
    async getOrderDetail(req: Request, res: Response, next: NextFunction) {
        try {
            const orderId = Number(req.params.id);
            const result = await orderService.getOrderDetail(req.user!.id, orderId);
            res.status(200).json({ message: "상세 조회 성공", data: result });
        } catch (error) {
            next(error);
        }
    }

    // 주문 취소
    async cancelOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const orderId = Number(req.params.id);
            const result = await orderService.cancelOrder(req.user!.id, orderId);
            res.status(200).json({ message: "주문이 취소되었습니다.", data: result });
        } catch (error) {
            next(error);
        }
    }

    // 반품 요청
    async requestReturn(req: Request, res: Response, next: NextFunction) {
        try {
            const orderId = Number(req.params.id);
            const result = await orderService.requestReturn(req.user!.id, orderId, req.body);
            res.status(200).json({ message: "반품 요청이 접수되었습니다.", data: result });
        } catch (error) {
            next(error);
        }
    }
}
