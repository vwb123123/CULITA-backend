import { z } from "zod";
import { registry } from "../config/openApi";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { paginationQuerySchema, createPaginatedResponseSchema } from "./common.schema";

extendZodWithOpenApi(z);

const OPEN_API_TAG = "Reviews";

// --- Enums ---
export const ReviewSortEnum = z.enum(["latest", "rating_desc", "rating_asc"]);

// --- 공통 파라미터 ---
export const reviewIdParamSchema = z.object({
    id: z.coerce.number().openapi({ example: 1, description: "리뷰 ID" }),
});

// --- 응답 모델 (Response) ---
const reviewImageSchema = z.object({
    id: z.number(),
    url: z.url(),
});

const userProfileSchema = z.object({
    name: z.string(), // 필요 시 마스킹 처리된 이름 반환
});

export const reviewResponseSchema = z.object({
    id: z.number(),
    rating: z.number(),
    content: z.string().nullable(),
    createdAt: z.date(),
    user: userProfileSchema.optional(), // 상품 리뷰 조회 시 작성자 정보
    product: z.object({ name: z.string() }).optional(), // 내 리뷰 조회 시 상품 정보
    images: z.array(reviewImageSchema),
});

// --- 1. 리뷰 작성 ---
export const createReviewSchema = z.object({
    productId: z.number().openapi({ example: 101, description: "구매확정된 상품 ID" }),
    rating: z.number().int().min(1).max(5).openapi({ example: 5 }),
    content: z
        .string()
        .min(10, "리뷰는 10자 이상 작성해야 합니다.")
        .openapi({ example: "배송도 빠르고 품질이 좋습니다." }),
    imageUrls: z
        .array(z.url())
        .optional()
        .openapi({
            example: ["https://storage.googleapis.com/.../img1.jpg"],
            description: "업로드 API를 통해 발급받은 이미지 URL 배열",
        }),
});

// --- 2. 리뷰 수정 ---
export const updateReviewSchema = z.object({
    rating: z.number().int().min(1).max(5).optional(),
    content: z.string().min(10).optional(),
    imageUrls: z
        .array(z.url())
        .optional()
        .openapi({ description: "기존 이미지를 덮어씁니다 (전체 교체)" }),
});

// --- 3. 리뷰 목록 조회 (상품별) ---
export const getProductReviewsQuerySchema = paginationQuerySchema.extend({
    productId: z.coerce.number().openapi({ example: 101, description: "조회할 상품 ID" }),
    sort: ReviewSortEnum.default("latest").openapi({ description: "정렬 (최신순, 별점순)" }),
});

// --- 4. 내 리뷰 조회 ---
export const getMyReviewsQuerySchema = paginationQuerySchema.extend({
    sort: ReviewSortEnum.default("latest"),
});

// --- 타입 정의 ---
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type GetProductReviewsQuery = z.infer<typeof getProductReviewsQuerySchema>;
export type GetMyReviewsQuery = z.infer<typeof getMyReviewsQuerySchema>;

// --- OpenAPI 등록 ---

// 1. 리뷰 작성
registry.registerPath({
    method: "post",
    path: "/reviews",
    summary: "리뷰 작성",
    description: "구매 확정(DELIVERED)된 상품에 한해 1회 작성 가능합니다.",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: { body: { content: { "application/json": { schema: createReviewSchema } } } },
    responses: {
        201: { description: "작성 성공" },
        403: { description: "구매 이력 없음 또는 이미 작성함" },
    },
});

// 2. 상품 리뷰 목록 조회 (Public)
registry.registerPath({
    method: "get",
    path: "/reviews/product",
    summary: "상품별 리뷰 목록 조회 (공개)",
    tags: [OPEN_API_TAG],
    request: { query: getProductReviewsQuerySchema },
    responses: {
        200: {
            description: "조회 성공",
            content: {
                "application/json": { schema: createPaginatedResponseSchema(reviewResponseSchema) },
            },
        },
    },
});

// 3. 내 리뷰 조회 (Private)
registry.registerPath({
    method: "get",
    path: "/reviews/me",
    summary: "내가 쓴 리뷰 조회",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: { query: getMyReviewsQuerySchema },
    responses: {
        200: {
            description: "조회 성공",
            content: {
                "application/json": { schema: createPaginatedResponseSchema(reviewResponseSchema) },
            },
        },
    },
});

// 4. 리뷰 수정
registry.registerPath({
    method: "put",
    path: "/reviews/{id}",
    summary: "리뷰 수정",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: {
        params: reviewIdParamSchema,
        body: { content: { "application/json": { schema: updateReviewSchema } } },
    },
    responses: { 200: { description: "수정 성공" } },
});

// 5. 리뷰 삭제
registry.registerPath({
    method: "delete",
    path: "/reviews/{id}",
    summary: "리뷰 삭제",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: { params: reviewIdParamSchema },
    responses: { 200: { description: "삭제 성공" } },
});
