import { z } from "zod";
import { registry } from "../config/openApi";
import { productDetailSchema } from "./product.schema";
import { ProductImageType } from "@prisma/client";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

const OPEN_API_TAG = "Admin/Products";

const productImageInputSchema = z.object({
    url: z.url().openapi({ example: "https://storage.googleapis.com/..." }),
    type: z.enum(ProductImageType).openapi({ example: "MAIN" }),
    order: z.number().int().openapi({ example: 0 }),
});

export const createProductSchema = z.object({
    name: z.string().min(1).openapi({ example: "에센스 토너" }),
    description: z.string().openapi({ example: "촉촉한 토너입니다." }),
    price: z.coerce.number().min(0).openapi({ example: 25000 }),
    stock: z.coerce.number().min(0).openapi({ example: 100 }),
    categoryId: z.coerce.number().openapi({ example: 1 }),

    productName: z.string().openapi({ example: "퓨어 에센스" }),
    volume: z.string().openapi({ example: "200ml" }),
    efficacyEffects: z.string().openapi({ example: "보습, 진정" }),
    ingredients: z.string().openapi({ example: "정제수, 글리세린" }),
    manufacturer: z.string().openapi({ example: "한국화장품" }),
    brandCompany: z.string().openapi({ example: "Culita" }),
    precautions: z.string().openapi({ example: "눈에 들어가지 않게 주의" }),

    isBest: z.coerce.boolean().optional().default(false),
    isNew: z.coerce.boolean().optional().default(true),

    images: z.array(productImageInputSchema).openapi({ description: "업로드된 이미지 정보 배열" }),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

registry.registerPath({
    method: "post",
    path: "/admin/products",
    summary: "상품 등록 (이미지 업로드)",
    description:
        "이미지 URL과 상품 정보를 JSON으로 전송합니다. (이미지는 /api/uploads 에서 먼저 업로드)",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { "application/json": { schema: createProductSchema } },
        },
    },
    responses: {
        201: {
            description: "등록 성공",
            content: {
                "application/json": {
                    schema: z.object({ message: z.string(), data: productDetailSchema }),
                },
            },
        },
    },
});

registry.registerPath({
    method: "put",
    path: "/admin/products/{id}",
    summary: "상품 수정 (JSON)",
    description: "상품 정보 및 이미지를 수정합니다. (이미지 배열 전체를 새로 보냄)",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({ id: z.coerce.number() }),
        body: { content: { "application/json": { schema: updateProductSchema } } },
    },
    responses: {
        200: { description: "수정 성공" },
    },
});

registry.registerPath({
    method: "delete",
    path: "/admin/products/{id}",
    summary: "상품 삭제",
    description: "DB 데이터와 Firebase Storage의 이미지를 모두 삭제합니다.",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({ id: z.coerce.number() }),
    },
    responses: {
        200: { description: "삭제 성공" },
    },
});
