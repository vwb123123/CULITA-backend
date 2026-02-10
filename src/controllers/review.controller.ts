import { Request, Response, NextFunction } from "express";
import { UserReviewService } from "../services/review.service";
import {
    GetProductReviewsQuery,
    GetMyReviewsQuery,
    ReviewSortType,
} from "../schemas/review.schema";

const reviewService = new UserReviewService();

export class UserReviewController {
    // 리뷰 작성
    async createReview(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await reviewService.createReview(req.user!.id, req.body);
            res.status(201).json({ message: "리뷰가 등록되었습니다.", data: result });
        } catch (error) {
            next(error);
        }
    }

    // 상품 리뷰 목록 (공개)
    async getProductReviews(req: Request, res: Response, next: NextFunction) {
        try {
            const { page, limit, sort, productId } = req.query;
            const query: GetProductReviewsQuery = {
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 10,
                sort: (sort as ReviewSortType) || "latest",
                productId: Number(productId), // 필수값이므로 변환
            };
            const result = await reviewService.getProductReviews(query);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    // 내 리뷰 목록 (개인)
    async getMyReviews(req: Request, res: Response, next: NextFunction) {
        try {
            const { page, limit, sort } = req.query;
            const query: GetMyReviewsQuery = {
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 10,
                sort: (sort as ReviewSortType) || "latest",
            };
            const result = await reviewService.getMyReviews(req.user!.id, query);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    // 리뷰 수정
    async updateReview(req: Request, res: Response, next: NextFunction) {
        try {
            const reviewId = Number(req.params.id);
            const result = await reviewService.updateReview(req.user!.id, reviewId, req.body);
            res.status(200).json({ message: "리뷰가 수정되었습니다.", data: result });
        } catch (error) {
            next(error);
        }
    }

    // 리뷰 삭제
    async deleteReview(req: Request, res: Response, next: NextFunction) {
        try {
            const reviewId = Number(req.params.id);
            const result = await reviewService.deleteReview(req.user!.id, reviewId);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}
