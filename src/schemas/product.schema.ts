import { z } from "zod";
import { registry } from "../config/openApi";
import { paginationQuerySchema, createPaginatedResponseSchema } from "./common.schema";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

const OPEN_API_TAG = "Products";

export const productIdParamSchema = z.object({
    id: z.coerce.number().openapi({ example: 1, description: "상품 ID" }),
});

export const productListQuerySchema = paginationQuerySchema.extend({
    categoryId: z.coerce.number().optional().openapi({ description: "카테고리 ID 필터" }),
    isBest: z.enum(["true", "false"]).optional().openapi({ description: "베스트 상품 여부" }),
    isNew: z.enum(["true", "false"]).optional().openapi({ description: "신상품 여부" }),
    sort: z
        .enum(["latest", "priceHigh", "priceLow"])
        .default("latest")
        .openapi({ description: "정렬 기준 (최신순/가격높은순/가격낮은순)" }),
});

const productImageSchema = z.object({
    id: z.number(),
    url: z.string(),
    type: z.enum(["MAIN", "HOVER", "DETAIL"]),
    order: z.number(),
});

export const productDetailSchema = z
    .object({
        id: z.number(),
        name: z.string(),
        description: z.string(),
        price: z.number(),
        stock: z.number(),
        isBest: z.boolean().nullable(),
        isNew: z.boolean().nullable(),
        productName: z.string(),
        volume: z.string(),
        efficacyEffects: z.string(),
        ingredients: z.string(),
        manufacturer: z.string(),
        brandCompany: z.string(),
        precautions: z.string(),
        category: z.object({
            id: z.number(),
            name: z.string(),
        }),
        images: z.array(productImageSchema),
    })
    .openapi({ title: "ProductDetail" });

export const productListItemSchema = z
    .object({
        id: z.number(),
        name: z.string(),
        price: z.number(),
        isBest: z.boolean().nullable(),
        isNew: z.boolean().nullable(),
        thumbnail: z.string().nullable().openapi({ description: "메인 이미지 URL" }),
        hoverImage: z.string().nullable().openapi({ description: "호버 이미지 URL" }),
    })
    .openapi({ title: "ProductListItem" });

export const productListResponseSchema = createPaginatedResponseSchema(
    productListItemSchema,
).openapi({ title: "ProductListResponse" });

export type ProductListQuery = z.infer<typeof productListQuerySchema>;

registry.register("ProductDetail", productDetailSchema);
registry.register("ProductListResponse", productListResponseSchema);

registry.registerPath({
    method: "get",
    path: "/products",
    summary: "상품 목록 조회",
    description: "카테고리, 베스트/신상 여부, 정렬 조건을 지원합니다.",
    tags: [OPEN_API_TAG],
    request: { query: productListQuerySchema },
    responses: {
        200: {
            description: "조회 성공",
            content: { "application/json": { schema: productListResponseSchema } },
        },
    },
});

registry.registerPath({
    method: "get",
    path: "/products/{id}",
    summary: "상품 상세 조회",
    tags: [OPEN_API_TAG],
    request: { params: productIdParamSchema },
    responses: {
        200: {
            description: "조회 성공",
            content: { "application/json": { schema: productDetailSchema } },
        },
        404: { description: "상품 없음" },
    },
});
