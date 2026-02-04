import { z } from "zod";
import { registry } from "../config/openApi";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

const OPEN_API_TAG = "Cart";

export const addToCartSchema = z.object({
    productId: z.number().openapi({ example: 1, description: "상품 ID" }),
    quantity: z.number().min(1).default(1).openapi({ example: 1, description: "담을 수량" }),
});

export const updateCartItemSchema = z.object({
    quantity: z.number().min(1).openapi({ example: 3, description: "변경할 수량" }),
});

export const cartItemIdParamSchema = z.object({
    itemId: z.coerce
        .number()
        .openapi({ example: 1, description: "장바구니 아이템 ID (CartItem.id)" }),
});

const cartItemResponseSchema = z.object({
    id: z.number(),
    quantity: z.number(),
    product: z.object({
        id: z.number(),
        name: z.string(),
        price: z.number(),
        thumbnail: z.string().nullable().optional(),
    }),
    totalPrice: z.number().openapi({ description: "수량 * 가격" }),
});

export const cartResponseSchema = z
    .object({
        id: z.number(),
        items: z.array(cartItemResponseSchema),
        cartTotal: z.number().openapi({ description: "장바구니 전체 합계 금액" }),
    })
    .openapi({ title: "CartResponse" });

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

registry.register("CartResponse", cartResponseSchema);

registry.registerPath({
    method: "get",
    path: "/cart",
    summary: "내 장바구니 조회",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: "조회 성공",
            content: { "application/json": { schema: cartResponseSchema } },
        },
    },
});

registry.registerPath({
    method: "post",
    path: "/cart",
    summary: "장바구니 담기",
    description: "이미 담긴 상품이면 수량을 추가(increment)하고, 없으면 새로 추가합니다.",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: {
        body: { content: { "application/json": { schema: addToCartSchema } } },
    },
    responses: {
        200: {
            description: "담기 성공",
            content: { "application/json": { schema: z.object({ message: z.string() }) } },
        },
        404: { description: "상품 없음" },
        400: { description: "재고 부족 등" },
    },
});

registry.registerPath({
    method: "put",
    path: "/cart/items/{itemId}",
    summary: "장바구니 아이템 수량 변경",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: {
        params: cartItemIdParamSchema,
        body: { content: { "application/json": { schema: updateCartItemSchema } } },
    },
    responses: {
        200: { description: "수정 성공" },
        404: { description: "아이템 없음" },
    },
});

registry.registerPath({
    method: "delete",
    path: "/cart/items/{itemId}",
    summary: "장바구니 아이템 삭제",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: {
        params: cartItemIdParamSchema,
    },
    responses: {
        200: { description: "삭제 성공" },
    },
});
