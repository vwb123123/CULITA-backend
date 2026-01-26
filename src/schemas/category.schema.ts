import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { registry } from "../config/openApi";

extendZodWithOpenApi(z);

export const categoryPathParamSchema = z.object({
    path: z.string().openapi({ example: "clothing", description: "카테고리 경로 (URL Path)" }),
});

const baseCategorySchema = z.object({
    id: z.number().openapi({ example: 1 }),
    name: z.string().openapi({ example: "의류" }),
    path: z.string().openapi({ example: "clothing" }),
    parentId: z.number().nullable().openapi({ example: null }),
});

export type CategoryResponse = z.infer<typeof baseCategorySchema> & {
    children: CategoryResponse[];
};

export const categoryResponseSchema: z.ZodType<CategoryResponse> = baseCategorySchema.extend({
    children: z.array(z.any())
        .openapi({
            type: 'array',
            items: { $ref: '#/components/schemas/CategoryResponse' }
        }),
}).openapi({ title: "CategoryResponse" });

export const breadcrumbSchema = z.object({
    id: z.number(),
    name: z.string(),
    path: z.string(),
}).openapi({ title: "Breadcrumb" });

registry.register("CategoryResponse", categoryResponseSchema);

registry.registerPath({
    method: 'get',
    path: '/categories',
    summary: '전체 카테고리 목록 조회',
    description: '최상위 카테고리부터 하위 카테고리까지 계층형(Tree) 구조로 반환합니다.',
    tags: ['Categories'],
    responses: {
        200: {
            description: '조회 성공',
            content: {
                'application/json': {
                    schema: z.array(categoryResponseSchema),
                },
            },
        },
    },
});

registry.registerPath({
    method: 'get',
    path: '/categories/{path}',
    summary: '카테고리 상세 및 경로 조회',
    description: '특정 path의 카테고리 정보와 상위 이동 경로(Breadcrumbs)를 반환합니다.',
    tags: ['Categories'],
    request: {
        params: categoryPathParamSchema,
    },
    responses: {
        200: {
            description: '조회 성공',
            content: {
                'application/json': {
                    schema: z.object({
                        category: categoryResponseSchema,
                        breadcrumbs: z.array(breadcrumbSchema),
                    }),
                },
            },
        },
        404: { description: '존재하지 않는 카테고리' },
    },
});