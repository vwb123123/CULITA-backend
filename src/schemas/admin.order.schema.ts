import { z } from "zod";
import { registry } from "../config/openApi";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { OrderStatus } from "@prisma/client";

extendZodWithOpenApi(z);

const OPEN_API_TAG = "Admin/Orders";

// --- Enums (Prisma Enum과 일치) ---
const OrderStatusEnum = z.enum(OrderStatus);

// --- 공통 파라미터 ---
export const adminOrderIdParamSchema = z.object({
    id: z.coerce.number().openapi({ example: 1, description: "주문 ID" }),
});

// --- 1. 주문 목록 조회 (필터링 포함) ---
export const getAdminOrderListQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    status: OrderStatusEnum.optional().openapi({ description: "주문 상태 필터" }),
    search: z.string().optional().openapi({ description: "주문자명, 이메일, 주문번호 검색" }),
    startDate: z.iso.date().optional().openapi({ example: "2024-01-01", description: "조회 시작일" }),
    endDate: z.iso.date().optional().openapi({ example: "2024-12-31", description: "조회 종료일" }),
});

// --- 2. 주문 상태 변경 (배송처리 등) ---
export const updateOrderStatusSchema = z.object({
    status: OrderStatusEnum.openapi({ example: "SHIPPING", description: "변경할 상태" }),
    trackingNumber: z
        .string()
        .optional()
        .openapi({ example: "1234567890", description: "운송장 번호 (SHIPPING 시 필수 권장)" }),
    carrier: z.string().optional().openapi({ example: "CJ대한통운", description: "택배사" }),
});

export type GetAdminOrderListQuery = z.infer<typeof getAdminOrderListQuerySchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

// --- OpenAPI 등록 ---

// 1. 전체 주문 조회
registry.registerPath({
    method: "get",
    path: "/admin/orders",
    summary: "전체 주문 목록 조회 (관리자)",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: { query: getAdminOrderListQuerySchema },
    responses: { 200: { description: "조회 성공" } },
});

// 2. 주문 상세 조회
registry.registerPath({
    method: "get",
    path: "/admin/orders/{id}",
    summary: "주문 상세 조회 (관리자)",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: { params: adminOrderIdParamSchema },
    responses: { 200: { description: "조회 성공" }, 404: { description: "주문 없음" } },
});

// 3. 주문 상태 변경
registry.registerPath({
    method: "patch",
    path: "/admin/orders/{id}/status",
    summary: "주문 상태 변경 및 운송장 입력",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: {
        params: adminOrderIdParamSchema,
        body: { content: { "application/json": { schema: updateOrderStatusSchema } } }
    },
    responses: { 200: { description: "상태 변경 성공" } },
});