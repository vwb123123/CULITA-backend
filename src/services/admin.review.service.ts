import { prisma } from "../config/prisma";
import { HttpException } from "../utils/exception.utils";
import { Prisma } from "@prisma/client";
import { GetAdminReviewListQuery } from "../schemas/admin.review.schema";

export class AdminReviewService {

    // --- 1. 리뷰 목록 조회 ---
    async getAllReviews(query: GetAdminReviewListQuery) {
        const { page, limit, search, productId, userId, startDate, endDate } = query;
        const skip = (page - 1) * limit;

        // 동적 쿼리 조건 생성
        const where: Prisma.ReviewWhereInput = {};

        // 검색 (작성자 이름 OR 리뷰 내용)
        if (search) {
            where.OR = [
                { content: { contains: search } },
                { user: { name: { contains: search } } },
            ];
        }

        // 필터링
        if (productId) where.productId = productId;
        if (userId) where.userId = userId;

        // 날짜 필터링
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`);
            if (endDate) where.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`);
        }

        const [total, reviews] = await Promise.all([
            prisma.review.count({ where }),
            prisma.review.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, email: true } }, // 작성자 정보
                    product: { select: { id: true, name: true } }, // 상품 정보
                    images: true,
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
        ]);

        return {
            data: reviews,
            pagination: {
                total,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                limit,
            },
        };
    }

    // --- 2. 리뷰 삭제 ---
    async deleteReview(reviewId: number) {
        const review = await prisma.review.findUnique({ where: { id: reviewId } });

        if (!review) {
            throw new HttpException(404, "삭제할 리뷰를 찾을 수 없습니다.");
        }

        await prisma.review.delete({ where: { id: reviewId } });

        return { message: "관리자 권한으로 리뷰가 삭제되었습니다.", deletedId: reviewId };
    }
}