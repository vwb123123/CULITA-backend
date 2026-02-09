import { z } from "zod";
import { registry } from "../config/openApi";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { createPaginatedResponseSchema, paginationQuerySchema } from "./common.schema";

extendZodWithOpenApi(z);

const OPEN_API_TAG = "Orders";

// --- 공통 파라미터 ---
export const orderIdParamSchema = z.object({
    id: z.coerce.number().openapi({ example: 1, description: "주문 ID" }),
});

// --- 1. 주문서 작성 (Checkout) ---
export const createOrderSchema = z.object({
    items: z
        .array(
            z.object({
                productId: z.number().openapi({ example: 101 }),
                quantity: z.number().min(1).openapi({ example: 2 }),
            }),
        )
        .min(1, "최소 하나 이상의 상품이 필요합니다."),
    recipientName: z.string().min(1).openapi({ example: "홍길동" }),
    recipientPhone: z.string().min(1).openapi({ example: "010-1234-5678" }),
    zipCode: z.string().min(1).openapi({ example: "12345" }),
    address1: z.string().min(1).openapi({ example: "서울시 강남구" }),
    address2: z.string().openapi({ example: "101동 101호" }),
    gatePassword: z.string().optional().openapi({ example: "#1234" }),
    deliveryRequest: z.string().optional().openapi({ example: "문 앞에 놔주세요" }),
});

// --- 2. 결제 승인 (Confirm) ---
export const confirmOrderSchema = z.object({
    orderId: z.string().openapi({ example: 1, description: "주문서 생성 시 받은 주문 ID" }),
    paymentKey: z
        .string()
        .openapi({ example: "toss_payment_key_xyz", description: "토스 결제 키" }),
    amount: z.number().openapi({ example: 50000, description: "결제된 총 금액" }),
});

// --- 3. 목록 조회 (Pagination) ---
export const getOrderListQuerySchema = paginationQuerySchema;

// --- 4. 반품 요청 ---
export const returnOrderSchema = z.object({
    reason: z
        .string()
        .min(5, "반품 사유를 5자 이상 입력해주세요.")
        .openapi({ example: "사이즈가 맞지 않아서 교환 원합니다." }),
});

const orderItemSchema = z.object({
    id: z.number(),
    quantity: z.number(),
    price: z.number(),
    product: z
        .object({
            name: z.string(),
            images: z.array(z.object({ url: z.string() })).optional(),
        })
        .optional(),
});

const paymentSchema = z.object({
    method: z.string(),
    amount: z.number(),
    status: z.string(),
    approvedAt: z.date().nullable(),
});

export const orderResponseSchema = z.object({
    id: z.number(),
    createdAt: z.date(),
    totalPrice: z.number(),
    status: z.string(), // 또는 enum
    recipientName: z.string(),
    trackingNumber: z.string().nullable(),
    items: z.array(orderItemSchema),
    payment: paymentSchema.nullable(),
});

// --- 타입 정의 ---
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type ConfirmOrderInput = z.infer<typeof confirmOrderSchema>;
export type GetOrderListQuery = z.infer<typeof getOrderListQuerySchema>;
export type ReturnOrderInput = z.infer<typeof returnOrderSchema>;

// --- OpenAPI 등록 ---

// 1. 주문서 작성
registry.registerPath({
    method: "post",
    path: "/orders/checkout",
    summary: "주문서 작성 (결제 전)",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: { body: { content: { "application/json": { schema: createOrderSchema } } } },
    responses: {
        201: { description: "주문서 생성 성공 (결제 대기)" },
        404: { description: "상품 없음" },
    },
});

// 2. 결제 승인
registry.registerPath({
    method: "post",
    path: "/orders/confirm",
    summary: "결제 승인 및 주문 확정",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: { body: { content: { "application/json": { schema: confirmOrderSchema } } } },
    responses: {
        200: { description: "결제 및 주문 완료" },
        400: { description: "금액 불일치 또는 결제 실패" },
    },
});

// 3. 주문 목록 조회
registry.registerPath({
    method: "get",
    path: "/orders",
    summary: "내 주문 내역 조회",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: { query: getOrderListQuerySchema }, // 페이지네이션 쿼리 적용
    responses: {
        200: {
            description: "조회 성공",
            content: {
                "application/json": {
                    // createPaginatedResponseSchema로 감싸서 응답 정의
                    schema: createPaginatedResponseSchema(orderResponseSchema),
                },
            },
        },
    },
});

// 4. 주문 상세 조회
registry.registerPath({
    method: "get",
    path: "/orders/{id}",
    summary: "주문 상세 조회",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: { params: orderIdParamSchema },
    responses: {
        200: {
            description: "조회 성공",
            content: { "application/json": { schema: orderResponseSchema } },
        },
        404: { description: "주문 없음" },
    },
});

// 5. 주문 취소
registry.registerPath({
    method: "post",
    path: "/orders/{id}/cancel",
    summary: "주문 취소 (배송 전)",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: { params: orderIdParamSchema },
    responses: {
        200: { description: "취소 완료 (환불 포함)" },
        400: { description: "이미 배송됨" },
    },
});

// 6. 반품 요청
registry.registerPath({
    method: "post",
    path: "/orders/{id}/return",
    summary: "반품 요청 (배송 완료 후)",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: {
        params: orderIdParamSchema,
        body: { content: { "application/json": { schema: returnOrderSchema } } },
    },
    responses: {
        200: { description: "반품 요청 완료" },
        400: { description: "배송 완료 상태가 아님" },
    },
});
