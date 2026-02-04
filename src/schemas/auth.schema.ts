import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { registry } from "../config/openApi";
import { Role } from "@prisma/client";

extendZodWithOpenApi(z);

const OPEN_API_TAG = "Auth";

export const registerSchema = z
    .object({
        username: z.string().min(4).openapi({ example: "user123" }),
        name: z.string().min(2).openapi({ example: "홍길동" }),
        email: z.email().openapi({ example: "user@example.com" }),
        phoneNumber: z
            .string()
            .regex(/^\d{3}-\d{3,4}-\d{4}$/)
            .openapi({ example: "010-1234-5678" }),
        password: z.string().min(8).openapi({ example: "password123!" }),
        password_confirm: z.string().openapi({ example: "password123!" }),
    })
    .refine(data => data.password === data.password_confirm, {
        message: "비밀번호가 일치하지 않습니다.",
        path: ["password_confirm"],
    });

export const loginSchema = z.object({
    username: z.string().openapi({ example: "user123" }),
    password: z.string().openapi({ example: "password123!" }),
});

export const userResponseSchema = z
    .object({
        id: z.number(),
        username: z.string(),
        name: z.string(),
        email: z.string(),
        phoneNumber: z.string(),
        role: z.enum(Role),
        createdAt: z.string(),
        updatedAt: z.string(),
    })
    .openapi({ title: "UserResponse" });

registry.registerPath({
    method: "post",
    path: "/auth/register",
    summary: "회원가입",
    tags: [OPEN_API_TAG],
    request: {
        body: {
            content: {
                "application/json": { schema: registerSchema },
            },
        },
    },
    responses: {
        201: {
            description: "회원가입 성공",
            content: {
                "application/json": {
                    schema: z.object({
                        message: z.string(),
                        data: userResponseSchema,
                    }),
                },
            },
        },
        400: { description: "유효성 검사 실패" },
        409: { description: "중복된 정보" },
    },
});

registry.registerPath({
    method: "post",
    path: "/auth/login",
    summary: "로그인",
    tags: [OPEN_API_TAG],
    request: {
        body: {
            content: {
                "application/json": { schema: loginSchema },
            },
        },
    },
    responses: {
        200: {
            description: "로그인 성공",
            content: {
                "application/json": {
                    schema: z.object({
                        message: z.string(),
                        data: z.object({
                            token: z.string(),
                            user: userResponseSchema,
                        }),
                    }),
                },
            },
        },
        405: { description: "로그인 실패" },
    },
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
