import { z } from "zod";
import { registry } from "../config/openApi";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { paginationQuerySchema, createPaginatedResponseSchema } from "./common.schema";
import { InquiryTypeEnum, InquiryStatusEnum } from "./inquiry.schema"; // Enum 재사용

extendZodWithOpenApi(z);

const OPEN_API_TAG = "Admin/Inquiries";

// --- 파라미터 ---
export const adminInquiryIdParamSchema = z.object({
    id: z.coerce.number().openapi({ example: 1, description: "문의 ID" }),
});

// --- 1. 문의 목록 조회 (검색/필터) ---
export const getAdminInquiryListQuerySchema = paginationQuerySchema.extend({
    type: InquiryTypeEnum.optional(),
    status: InquiryStatusEnum.optional(),
    search: z.string().optional().openapi({ description: "회원명, 이메일, 제목 검색" }),
    startDate: z.iso.date().optional(),
    endDate: z.iso.date().optional(),
});

// --- 2. 답변 등록/수정 ---
export const answerInquirySchema = z.object({
    answer: z.string().min(1, "답변 내용을 입력해주세요.").openapi({ example: "안녕하세요, 문의하신 내용은..." }),
});

// --- 응답 모델 ---
const adminInquiryResponseSchema = z.object({
    id: z.number(),
    type: InquiryTypeEnum,
    title: z.string(),
    content: z.string(),
    status: InquiryStatusEnum,
    answer: z.string().nullable(),
    answeredAt: z.date().nullable(),
    createdAt: z.date(),
    user: z.object({
        id: z.number(),
        name: z.string(),
        email: z.string(),
    }),
    images: z.array(z.object({ url: z.string() })),
});

export type GetAdminInquiryListQuery = z.infer<typeof getAdminInquiryListQuerySchema>;
export type AnswerInquiryInput = z.infer<typeof answerInquirySchema>;

// --- OpenAPI 등록 ---

// 1. 전체 문의 조회
registry.registerPath({
    method: "get",
    path: "/admin/inquiries",
    summary: "전체 문의 조회 (관리자)",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: { query: getAdminInquiryListQuerySchema },
    responses: {
        200: {
            description: "조회 성공",
            content: { "application/json": { schema: createPaginatedResponseSchema(adminInquiryResponseSchema) } },
        },
    },
});

// 2. 문의 상세 조회
registry.registerPath({
    method: "get",
    path: "/admin/inquiries/{id}",
    summary: "문의 상세 조회 (관리자)",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: { params: adminInquiryIdParamSchema },
    responses: { 200: { description: "조회 성공" } },
});

// 3. 답변 등록/수정
registry.registerPath({
    method: "patch",
    path: "/admin/inquiries/{id}/answer",
    summary: "문의 답변 등록 및 수정",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: {
        params: adminInquiryIdParamSchema,
        body: { content: { "application/json": { schema: answerInquirySchema } } }
    },
    responses: { 200: { description: "답변 등록 성공" } },
});

// 4. 문의 삭제 (강제 삭제)
registry.registerPath({
    method: "delete",
    path: "/admin/inquiries/{id}",
    summary: "문의 강제 삭제",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: { params: adminInquiryIdParamSchema },
    responses: { 200: { description: "삭제 성공" } },
});