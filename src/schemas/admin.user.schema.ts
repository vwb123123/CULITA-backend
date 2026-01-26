import { z } from "zod";
import { registry } from "../config/openApi";
import { userResponseSchema } from "./auth.schema";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const userIdParamSchema = z.object({
    id: z.coerce.number().openapi({ example: 1, description: "사용자 ID" }),
});

export const paginationQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1).openapi({ example: 1, description: "페이지 번호" }),
    limit: z.coerce
        .number()
        .min(1)
        .max(100)
        .default(10)
        .openapi({ example: 10, description: "페이지당 항목 수" }),
});

export const createUserSchema = z.object({
    username: z.string().min(4).openapi({ example: "admin_user" }),
    name: z.string().min(2).openapi({ example: "관리자 생성 유저" }),
    email: z.email().openapi({ example: "created@example.com" }),
    password: z.string().min(8).openapi({ example: "password123!" }),
    phoneNumber: z
        .string()
        .regex(/^\d{3}-\d{3,4}-\d{4}$/)
        .openapi({ example: "010-9999-8888" }),
    role: z.enum(["USER", "ADMIN"]).optional().default("USER").openapi({ example: "USER" }),
});

export const updateUserSchema = z.object({
    name: z.string().min(2).optional().openapi({ example: "수정된 이름" }),
    email: z.email().optional().openapi({ example: "updated@example.com" }),
    password: z.string().min(8).optional().openapi({ example: "newpassword123!" }),
    phoneNumber: z
        .string()
        .regex(/^\d{3}-\d{3,4}-\d{4}$/)
        .optional()
        .openapi({ example: "010-7777-6666" }),
    role: z.enum(["USER", "ADMIN"]).optional().openapi({ example: "ADMIN" }),
});

registry.registerPath({
    method: "get",
    path: "/admin/users",
    summary: "전체 회원 목록 조회",
    tags: ["Admin Users"],
    security: [{ bearerAuth: [] }],
    request: {
        query: paginationQuerySchema,
    },
    responses: {
        200: {
            description: "조회 성공",
            content: {
                "application/json": {
                    schema: z.object({
                        data: z.array(userResponseSchema),
                        pagination: z.object({
                            totalUsers: z.number(),
                            totalPages: z.number(),
                            currentPage: z.number(),
                            limit: z.number(),
                        }),
                    }),
                },
            },
        },
    },
});

registry.registerPath({
    method: "get",
    path: "/admin/users/{id}",
    summary: "회원 상세 조회",
    tags: ["Admin Users"],
    security: [{ bearerAuth: [] }],
    request: {
        params: userIdParamSchema,
    },
    responses: {
        200: {
            description: "성공",
            content: {
                "application/json": {
                    schema: z.object({ data: userResponseSchema }),
                },
            },
        },
        404: { description: "회원 없음" },
    },
});

registry.registerPath({
    method: "post",
    path: "/admin/users",
    summary: "회원 직접 생성 (관리자)",
    tags: ["Admin Users"],
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { "application/json": { schema: createUserSchema } },
        },
    },
    responses: {
        201: {
            description: "생성 성공",
            content: {
                "application/json": {
                    schema: z.object({
                        message: z.string(),
                        data: userResponseSchema,
                    }),
                },
            },
        },
        409: { description: "이메일 중복" },
    },
});

registry.registerPath({
    method: "put",
    path: "/admin/users/{id}",
    summary: "회원 정보 수정 (관리자)",
    tags: ["Admin Users"],
    security: [{ bearerAuth: [] }],
    request: {
        params: userIdParamSchema,
        body: {
            content: { "application/json": { schema: updateUserSchema } },
        },
    },
    responses: {
        200: {
            description: "수정 성공",
            content: {
                "application/json": {
                    schema: z.object({
                        message: z.string(),
                        data: userResponseSchema,
                    }),
                },
            },
        },
    },
});

registry.registerPath({
    method: "delete",
    path: "/admin/users/{id}",
    summary: "회원 삭제 (관리자)",
    tags: ["Admin Users"],
    security: [{ bearerAuth: [] }],
    request: {
        params: userIdParamSchema,
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
    },
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;