import { Request, Response, NextFunction } from "express";
import { AdminReviewService } from "../services/admin.review.service";
import { GetAdminReviewListQuery } from "../schemas/admin.review.schema";

const adminReviewService = new AdminReviewService();

export class AdminReviewController {
    async getAllReviews(req: Request, res: Response, next: NextFunction) {
        try {
            const { page, limit, search, productId, userId, startDate, endDate } = req.query;

            const query: GetAdminReviewListQuery = {
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 10,
                search: search as string | undefined,
                productId: productId ? Number(productId) : undefined,
                userId: userId ? Number(userId) : undefined,
                startDate: startDate ? startDate as string : undefined,
                endDate: endDate ? endDate as string : undefined,
            };

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
