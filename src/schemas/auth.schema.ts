import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { registry } from "../config/openApi";
import { Role, Gender } from "@prisma/client";

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
        gender: z.enum(Gender).openapi({ example: "MALE", description: "MALE 또는 FEMALE" }),
        zipCode: z.string().min(5).openapi({ example: "12345" }),
        address1: z.string().min(1).openapi({ example: "서울시 강남구 테헤란로 123" }),
        address2: z.string().optional().openapi({ example: "101동 101호" }), // 상세주소는 없을 수 있음
        birthYear: z
            .string()
            .length(4, "태어난 연도는 4자리여야 합니다.")
            .openapi({ example: "1990" }),
        birthMonth: z.string().min(1).max(2).openapi({ example: "01" }),
        birthDay: z.string().min(1).max(2).openapi({ example: "01" }),
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
        createdAt: z.string(),
        updatedAt: z.string(),
        username: z.string(),
        name: z.string(),
        email: z.string(),
        phoneNumber: z.string(),
        role: z.enum(Role),
        gender: z.enum(Gender),
        birthYear: z.string(),
        birthMonth: z.string(),
        birthDay: z.string(),
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
