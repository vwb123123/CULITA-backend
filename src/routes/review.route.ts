import { Router } from "express";
import { UserReviewController } from "../controllers/review.controller";
import { authenticateJwt } from "../middlewares/auth.middleware";
import { validateBody, validateQuery, validateParams } from "../middlewares/validation.middleware";
import {
    createReviewSchema,
    updateReviewSchema,
    getProductReviewsQuerySchema,
    getMyReviewsQuerySchema,
    reviewIdParamSchema,
} from "../schemas/review.schema";

const router = Router();
const reviewController = new UserReviewController();

// 1. 상품별 리뷰 목록 조회 (Public - 로그인이 필요 없음)
router.get(
    "/product",
    validateQuery(getProductReviewsQuerySchema),
    reviewController.getProductReviews,
);

// --- 아래 기능들은 모두 로그인 필요 ---
router.use(authenticateJwt);

// 2. 내 리뷰 조회
router.get("/me", validateQuery(getMyReviewsQuerySchema), reviewController.getMyReviews);

// 3. 리뷰 작성
router.post("/", validateBody(createReviewSchema), reviewController.createReview);

// 4. 리뷰 수정
router.put(
    "/:id",
    validateParams(reviewIdParamSchema),
    validateBody(updateReviewSchema),
    reviewController.updateReview,
);

// 5. 리뷰 삭제
router.delete("/:id", validateParams(reviewIdParamSchema), reviewController.deleteReview);

export default router;
