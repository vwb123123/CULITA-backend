import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const paginationQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1).openapi({ example: 1, description: "페이지 번호" }),
    limit: z.coerce.number().min(1).max(100).default(10).openapi({ example: 10, description: "페이지당 항목 수" }),
});

export const createPaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) => {
    return z.object({
        data: z.array(itemSchema),
        pagination: z.object({
            total: z.number().openapi({ example: 100, description: "전체 항목 수" }),
            totalPages: z.number().openapi({ example: 10, description: "전체 페이지 수" }),
            currentPage: z.number().openapi({ example: 1, description: "현재 페이지" }),
            limit: z.number().openapi({ example: 10, description: "페이지당 항목 수" }),
        }),
    });
};

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;