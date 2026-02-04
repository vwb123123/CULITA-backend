import { Request, Response, NextFunction } from "express";
import { AdminReviewService } from "../services/admin.review.service";
import { GetAdminReviewListQuery } from "../schemas/admin.review.schema";

const adminReviewService = new AdminReviewService();

export class AdminReviewController {
    // 전체 리뷰 조회
    async getAllReviews(req: Request, res: Response, next: NextFunction) {
        try {
            // Type Assertion: 미들웨어 검증 후 안전하게 타입 변환
            const query = req.query as unknown as GetAdminReviewListQuery;

            const result = await adminReviewService.getAllReviews(query);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    // 리뷰 삭제
    async deleteReview(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            const result = await adminReviewService.deleteReview(id);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}
