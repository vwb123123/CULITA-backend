import { z } from "zod";
import { registry } from "../config/openApi";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { paginationQuerySchema, createPaginatedResponseSchema } from "./common.schema";

extendZodWithOpenApi(z);

const OPEN_API_TAG = "Admin/Reviews";

export const adminReviewIdParamSchema = z.object({
    id: z.coerce.number().openapi({ example: 1, description: "리뷰 ID" }),
});

// --- 목록 조회 (검색/필터) ---
export const getAdminReviewListQuerySchema = paginationQuerySchema.extend({
    search: z.string().optional().openapi({ description: "리뷰 내용 또는 작성자 이름 검색" }),
    productId: z.coerce.number().optional().openapi({ description: "특정 상품의 리뷰만 조회" }),
    userId: z.coerce.number().optional().openapi({ description: "특정 회원의 리뷰만 조회" }),
    startDate: z.iso.date().optional().openapi({ example: "2024-01-01" }),
    endDate: z.iso.date().optional().openapi({ example: "2024-12-31" }),
});

// --- 응답 모델 ---
// 관리자는 사용자 상세 정보(이메일 등)도 볼 수 있도록 확장
const adminReviewResponseSchema = z.object({
    id: z.number(),
    rating: z.number(),
    content: z.string().nullable(),
    createdAt: z.date(),
    user: z.object({
        id: z.number(),
        name: z.string(),
        email: z.string(),
    }),
    product: z.object({
        id: z.number(),
        name: z.string(),
    }),
    images: z.array(z.object({ url: z.string() })),
});

export type GetAdminReviewListQuery = z.infer<typeof getAdminReviewListQuerySchema>;

// --- OpenAPI 등록 ---

// 1. 전체 리뷰 조회
registry.registerPath({
    method: "get",
    path: "/admin/reviews",
    summary: "전체 리뷰 조회 (관리자)",
    description: "작성자명, 내용 검색 및 날짜 필터링을 지원합니다.",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: { query: getAdminReviewListQuerySchema },
    responses: {
        200: {
            description: "조회 성공",
            content: {
                "application/json": {
                    schema: createPaginatedResponseSchema(adminReviewResponseSchema),
                },
            },
        },
    },
});

// 2. 리뷰 삭제
registry.registerPath({
    method: "delete",
    path: "/admin/reviews/{id}",
    summary: "리뷰 삭제 (관리자)",
    description: "부적절한 리뷰를 강제로 삭제합니다.",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: { params: adminReviewIdParamSchema },
    responses: { 200: { description: "삭제 성공" } },
});
