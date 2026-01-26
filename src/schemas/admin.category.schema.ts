import { z } from "zod";
import { registry } from "../config/openApi";
import { categoryResponseSchema } from "./category.schema";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const categoryIdParamSchema = z.object({
    id: z.coerce.number().openapi({ example: 1, description: "카테고리 ID" }),
});

export const createCategorySchema = z.object({
    name: z.string().min(1, "이름은 필수입니다.").openapi({ example: "남성복" }),
    path: z
        .string()
        .regex(/^[a-z0-9-]+$/, "영문 소문자, 숫자, 하이픈만 가능합니다.")
        .openapi({ example: "men-clothing" }),
    parentId: z
        .number()
        .nullable()
        .optional()
        .openapi({ example: null, description: "상위 카테고리 ID (없으면 null 또는 생략)" }),
});

export const updateCategorySchema = z.object({
    name: z.string().min(1).optional().openapi({ example: "수정된 카테고리명" }),
    path: z
        .string()
        .regex(/^[a-z0-9-]+$/)
        .optional()
        .openapi({ example: "modified-path" }),
    parentId: z.number().nullable().optional().openapi({ example: 2 }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

registry.registerPath({
    method: "post",
    path: "/admin/categories",
    summary: "카테고리 생성 (관리자)",
    tags: ["Admin Categories"],
    security: [{ bearerAuth: [] }],
    request: {
        body: { content: { "application/json": { schema: createCategorySchema } } },
    },
    responses: {
        201: {
            description: "생성 성공",
            content: {
                "application/json": {
                    schema: z.object({
                        message: z.string(),
                        data: categoryResponseSchema,
                    }),
                },
            },
        },
        409: { description: "경로 중복" },
        404: { description: "부모 카테고리 없음" },
    },
});

registry.registerPath({
    method: "put",
    path: "/admin/categories/{id}",
    summary: "카테고리 수정 (관리자)",
    tags: ["Admin Categories"],
    security: [{ bearerAuth: [] }],
    request: {
        params: categoryIdParamSchema,
        body: { content: { "application/json": { schema: updateCategorySchema } } },
    },
    responses: {
        200: {
            description: "수정 성공",
            content: {
                "application/json": {
                    schema: z.object({
                        message: z.string(),
                        data: categoryResponseSchema,
                    }),
                },
            },
        },
        409: { description: "경로 중복" },
        400: { description: "자신을 부모로 설정 불가" },
    },
});

registry.registerPath({
    method: "delete",
    path: "/admin/categories/{id}",
    summary: "카테고리 삭제 (관리자)",
    tags: ["Admin Categories"],
    security: [{ bearerAuth: [] }],
    request: {
        params: categoryIdParamSchema,
    },
    responses: {
        200: {
            description: "삭제 성공",
            content: {
                "application/json": {
                    schema: z.object({
                        message: z.string(),
                        deletedId: z.number(),
                    }),
                },
            },
        },
        400: { description: "하위 카테고리 또는 상품 존재로 삭제 불가" },
    },
});
