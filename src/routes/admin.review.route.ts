import { Router } from "express";
import { AdminReviewController } from "../controllers/admin.review.controller";
import { authenticateJwt } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/admin.middleware";
import { validateQuery, validateParams } from "../middlewares/validation.middleware";
import {
    getAdminReviewListQuerySchema,
    adminReviewIdParamSchema,
} from "../schemas/admin.review.schema";

const router = Router();
const reviewController = new AdminReviewController();

// 모든 관리자 API는 인증 + 관리자 권한 필수
router.use(authenticateJwt, isAdmin);

// 1. 전체 리뷰 조회 (검색/필터)
router.get("/", validateQuery(getAdminReviewListQuerySchema), reviewController.getAllReviews);

// 2. 리뷰 삭제
router.delete("/:id", validateParams(adminReviewIdParamSchema), reviewController.deleteReview);

export default router;
