import { z } from "zod";
import { registry } from "../config/openApi";
import { productDetailSchema } from "./product.schema";

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

    imageMetadata: z
        .string()
        .openapi({ example: '[{"type":"MAIN","order":0},{"type":"HOVER","order":1}]' }),
});

export const updateProductSchema = createProductSchema.partial().omit({ imageMetadata: true });

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

registry.registerPath({
    method: "post",
    path: "/admin/products",
    summary: "상품 등록 (이미지 업로드)",
    description:
        'multipart/form-data로 전송해야 합니다. "images" 필드에 파일을, "imageMetadata" 필드에 JSON 문자열을 보냅니다.',
    tags: ["Admin Products"],
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                "multipart/form-data": {
                    schema: createProductSchema.extend({
                        images: z
                            .any()
                            .openapi({
                                type: "array",
                                items: { type: "string", format: "binary" },
                            }),
                    }),
                },
            },
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
    summary: "상품 정보 수정 (텍스트만)",
    description: "이미지 수정은 별도 API를 사용하거나 추후 구현",
    tags: ["Admin Products"],
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
    tags: ["Admin Products"],
    security: [{ bearerAuth: [] }],
    request: {
        params: z.object({ id: z.coerce.number() }),
    },
    responses: {
        200: { description: "삭제 성공" },
    },
});
