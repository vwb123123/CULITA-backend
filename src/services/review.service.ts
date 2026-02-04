import { prisma } from "../config/prisma";
import { HttpException } from "../utils/exception.utils";
import {
    CreateReviewInput,
    GetMyReviewsQuery,
    GetProductReviewsQuery,
    UpdateReviewInput,
} from "../schemas/review.schema";

export class UserReviewService {
    // --- 1. 리뷰 작성 ---
    async createReview(userId: number, data: CreateReviewInput) {
        // A. 중복 작성 확인
        const existingReview = await prisma.review.findFirst({
            where: { userId, productId: data.productId },
        });

        if (existingReview) {
            throw new HttpException(409, "이미 해당 상품에 대한 리뷰를 작성하셨습니다.");
        }

        // B. 구매 및 배송 완료 여부 확인
        const purchaseHistory = await prisma.order.findFirst({
            where: {
                userId,
                status: "DELIVERED", // 배송 완료된 건만
                items: {
                    some: { productId: data.productId },
                },
            },
        });

        if (!purchaseHistory) {
            throw new HttpException(
                403,
                "배송이 완료된 상품에 대해서만 리뷰를 작성할 수 있습니다.",
            );
        }

        // C. 리뷰 생성 (트랜잭션)
        return await prisma.$transaction(async tx => {
            return await tx.review.create({
                data: {
                    userId,
                    productId: data.productId,
                    rating: data.rating,
                    content: data.content,
                    images: {
                        create: data.imageUrls?.map(url => ({ url })) || [],
                    },
                },
                include: { images: true },
            });
        });
    }

    // --- 2. 상품별 리뷰 목록 조회 (Public) ---
    async getProductReviews(query: GetProductReviewsQuery) {
        const { productId, page, limit, sort } = query;
        const skip = (page - 1) * limit;

        const orderBy: any = this.getOrderBy(sort);

        const [total, reviews] = await Promise.all([
            prisma.review.count({ where: { productId } }),
            prisma.review.findMany({
                where: { productId },
                include: {
                    user: { select: { name: true } }, // 작성자 이름 노출
                    images: true,
                },
                orderBy,
                skip,
                take: limit,
            }),
        ]);

        return {
            data: reviews,
            pagination: { total, totalPages: Math.ceil(total / limit), currentPage: page, limit },
        };
    }

    // --- 3. 내 리뷰 조회 (Private) ---
    async getMyReviews(userId: number, query: GetMyReviewsQuery) {
        const { page, limit, sort } = query;
        const skip = (page - 1) * limit;

        const orderBy: any = this.getOrderBy(sort);

        const [total, reviews] = await Promise.all([
            prisma.review.count({ where: { userId } }),
            prisma.review.findMany({
                where: { userId },
                include: {
                    product: { select: { name: true, images: { take: 1 } } }, // 어떤 상품인지
                    images: true,
                },
                orderBy,
                skip,
                take: limit,
            }),
        ]);

        return {
            data: reviews,
            pagination: { total, totalPages: Math.ceil(total / limit), currentPage: page, limit },
        };
    }

    // --- 4. 리뷰 수정 ---
    async updateReview(userId: number, reviewId: number, data: UpdateReviewInput) {
        const review = await prisma.review.findUnique({ where: { id: reviewId } });

        if (!review || review.userId !== userId) {
            throw new HttpException(403, "수정 권한이 없습니다.");
        }

        return await prisma.$transaction(async tx => {
            // 이미지가 전달된 경우: 기존 이미지 싹 지우고 새로 등록 (덮어쓰기)
            if (data.imageUrls) {
                await tx.reviewImage.deleteMany({ where: { reviewId } });
                await tx.reviewImage.createMany({
                    data: data.imageUrls.map(url => ({ reviewId, url })),
                });
            }

            return await tx.review.update({
                where: { id: reviewId },
                data: {
                    rating: data.rating,
                    content: data.content,
                },
                include: { images: true },
            });
        });
    }

    // --- 5. 리뷰 삭제 ---
    async deleteReview(userId: number, reviewId: number) {
        const review = await prisma.review.findUnique({ where: { id: reviewId } });

        if (!review || review.userId !== userId) {
            throw new HttpException(403, "삭제 권한이 없습니다.");
        }

        // OnDelete: Cascade 설정이 되어 있다면 이미지는 자동 삭제됨
        await prisma.review.delete({ where: { id: reviewId } });

        return { message: "리뷰가 삭제되었습니다.", deletedId: reviewId };
    }

    // 헬퍼: 정렬 조건 생성
    private getOrderBy(sort: string) {
        if (sort === "rating_desc") return { rating: "desc" };
        if (sort === "rating_asc") return { rating: "asc" };
        return { createdAt: "desc" };
    }
}
