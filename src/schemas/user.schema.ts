import { z } from "zod";
import { registry } from "../config/openApi";
import { userResponseSchema } from "./auth.schema";
import { Gender } from "@prisma/client";

const OPEN_API_TAG = "Users";

export const updateProfileSchema = z.object({
    name: z
        .string()
        .min(2, "이름은 2자 이상이어야 합니다.")
        .optional()
        .openapi({ example: "홍길동" }),
    phoneNumber: z
        .string()
        .regex(/^\d{3}-\d{3,4}-\d{4}$/, "전화번호 형식이 올바르지 않습니다.")
        .optional()
        .openapi({ example: "010-5678-1234" }),
    gender: z.enum(Gender).optional().openapi({ example: "MALE" }),
    zipCode: z.string().min(5).optional().openapi({ example: "12345" }),
    address1: z.string().min(1).optional().openapi({ example: "서울시 강남구" }),
    address2: z.string().optional().openapi({ example: "101동 101호" }),
    birthYear: z.string().length(4).optional().openapi({ example: "1990" }),
    birthMonth: z.string().min(1).max(2).optional().openapi({ example: "01" }),
    birthDay: z.string().min(1).max(2).openapi({ example: "01" }),
});

export const changePasswordSchema = z
    .object({
        currentPassword: z
            .string()
            .min(1, "현재 비밀번호를 입력해주세요.")
            .openapi({ example: "oldpassword123!" }),
        newPassword: z
            .string()
            .min(8, "새 비밀번호는 8자 이상이어야 합니다.")
            .openapi({ example: "newpassword123!" }),
        newPasswordConfirm: z.string().openapi({ example: "newpassword123!" }),
    })
    .refine(data => data.newPassword === data.newPasswordConfirm, {
        message: "새 비밀번호가 일치하지 않습니다.",
        path: ["newPasswordConfirm"],
    });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

registry.registerPath({
    method: "put",
    path: "/users/me",
    summary: "내 정보 수정",
    description: "로그인한 사용자의 이름, 전화번호를 수정합니다.",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: {
        body: { content: { "application/json": { schema: updateProfileSchema } } },
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
    method: "patch",
    path: "/users/me/password",
    summary: "비밀번호 변경",
    description: "현재 비밀번호를 확인 후 새 비밀번호로 변경합니다.",
    tags: [OPEN_API_TAG],
    security: [{ bearerAuth: [] }],
    request: {
        body: { content: { "application/json": { schema: changePasswordSchema } } },
    },
    responses: {
        200: {
            description: "변경 성공",
            content: { "application/json": { schema: z.object({ message: z.string() }) } },
        },
        400: { description: "현재 비밀번호 불일치" },
    },
});
