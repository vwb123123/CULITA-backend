import { z } from "zod";
import { registry } from "../config/openApi";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { paginationQuerySchema, createPaginatedResponseSchema } from "./common.schema";
import { InquiryStatus, InquiryType } from "@prisma/client";

extendZodWithOpenApi(z);

const OPEN_API_TAG = "Inquiries";

// --- Enums ---
export const InquiryTypeEnum = z.enum(InquiryType);
export const InquiryStatusEnum = z.enum(InquiryStatus);

// --- 파라미터 ---
export const inquiryIdParamSchema = z.object({
    id: z.coerce.number().openapi({ example: 1, description: "문의 ID" }),
});

// --- 응답 모델 ---
const inquiryImageSchema = z.object({
    id: z.number(),
    url: z.url(),
});

const inquiryResponseSchema = z.object({
    id: z.number(),
    type: InquiryTypeEnum,
    title: z.string(),
    content: z.string(),
    status: InquiryStatusEnum,
    answer: z.string().nullable(), // 관리자 답변
    answeredAt: z.date().nullable(),
    createdAt: z.date(),
    images: z.array(inquiryImageSchema),
});

// --- 1. 문의 등록 ---
export const createInquirySchema = z.object({
    type: InquiryTypeEnum.openapi({ example: "PRODUCT", description: "문의 유형" }),
    title: z.string().min(1, "제목을 입력해주세요.").openapi({ example: "상품 사이즈 문의" }),
    content: z
        .string()
        .min(10, "내용은 10자 이상 입력해주세요.")
        .openapi({ example: "이거 사이즈가 어떻게 되나요?" }),
    imageUrls: z
        .array(z.url())
        .optional()
        .openapi({ example: ["https://storage.../1.jpg"] }),
});

// --- 2. 문의 수정 ---
export const updateInquirySchema = z.object({
    type: InquiryTypeEnum.optional(),
    title: z.string().min(1).optional(),
    content: z.string().min(10).optional(),
    imageUrls: z.array(z.url()).optional(),
});

// --- 3. 문의 목록 조회 (필터링 포함) ---
export const getInquiryListQuerySchema = paginationQuerySchema.extend({
    type: InquiryTypeEnum.optional().openapi({ description: "문의 유형 필터" }),
    status: InquiryStatusEnum.optional().openapi({
        description: "답변 상태 필터 (PENDING/ANSWERED)",
    }),
});

export type CreateInquiryInput = z.infer<typeof createInquirySchema>;
export type UpdateInquiryInput = z.infer<typeof updateInquirySchema>;
export type GetInquiryListQuery = z.infer<typeof getInquiryListQuerySchema>;

// --- OpenAPI 등록 ---

// 1. 목록 조회
registry.registerPath({
    method: "get",
    path: "/inquiries",
    summary: "내 문의 내역 조회",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: { query: getInquiryListQuerySchema },
    responses: {
        200: {
            description: "조회 성공",
            content: {
                "application/json": {
                    schema: createPaginatedResponseSchema(inquiryResponseSchema),
                },
            },
        },
    },
});

// 2. 상세 조회
registry.registerPath({
    method: "get",
    path: "/inquiries/{id}",
    summary: "문의 상세 조회",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: { params: inquiryIdParamSchema },
    responses: {
        200: {
            description: "조회 성공",
            content: { "application/json": { schema: inquiryResponseSchema } },
        },
        404: { description: "문의 없음" },
    },
});

// 3. 문의 등록
registry.registerPath({
    method: "post",
    path: "/inquiries",
    summary: "1:1 문의 등록",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: { body: { content: { "application/json": { schema: createInquirySchema } } } },
    responses: { 201: { description: "등록 성공" } },
});

// 4. 문의 수정
registry.registerPath({
    method: "put",
    path: "/inquiries/{id}",
    summary: "문의 수정",
    description: "답변 대기(PENDING) 상태일 때만 수정 가능합니다.",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: {
        params: inquiryIdParamSchema,
        body: { content: { "application/json": { schema: updateInquirySchema } } },
    },
    responses: { 200: { description: "수정 성공" }, 400: { description: "이미 답변 완료됨" } },
});

// 5. 문의 삭제
registry.registerPath({
    method: "delete",
    path: "/inquiries/{id}",
    summary: "문의 삭제",
    description: "답변 대기(PENDING) 상태일 때만 삭제 가능합니다.",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: { params: inquiryIdParamSchema },
    responses: { 200: { description: "삭제 성공" }, 400: { description: "이미 답변 완료됨" } },
});
