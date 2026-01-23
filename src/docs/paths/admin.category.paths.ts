export const adminCategoryPaths = {
    "/api/admin/categories": {
        post: {
            summary: "카테고리 생성 (관리자)",
            tags: ["Admin Categories"],
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/CreateCategoryInput" },
                    },
                },
            },
            responses: {
                "201": {
                    description: "생성 성공",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    message: { type: "string", example: "카테고리 생성 성공" },
                                    data: { $ref: "#/components/schemas/CategoryResponse" },
                                },
                            },
                        },
                    },
                },
                "409": { description: "이미 존재하는 경로(path)" },
            },
        },
    },
    "/api/admin/categories/{id}": {
        put: {
            summary: "카테고리 수정 (관리자)",
            tags: ["Admin Categories"],
            security: [{ bearerAuth: [] }],
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            requestBody: {
                content: {
                    "application/json": {
                        schema: { $ref: "#/components/schemas/UpdateCategoryInput" },
                    },
                },
            },
            responses: {
                "200": {
                    description: "수정 성공",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    message: { type: "string", example: "카테고리 수정 성공" },
                                    data: { $ref: "#/components/schemas/CategoryResponse" },
                                },
                            },
                        },
                    },
                },
                "404": { description: "카테고리 없음" },
            },
        },
        delete: {
            summary: "카테고리 삭제 (관리자)",
            description: "하위 카테고리나 연결된 상품이 없을 때만 삭제 가능합니다.",
            tags: ["Admin Categories"],
            security: [{ bearerAuth: [] }],
            parameters: [{ in: "path", name: "id", required: true, schema: { type: "integer" } }],
            responses: {
                "200": {
                    description: "삭제 성공",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    message: { type: "string", example: "카테고리가 삭제되었습니다." },
                                    deletedId: { type: "integer", example: 1 },
                                },
                            },
                        },
                    },
                },
                "400": { description: "하위 카테고리 또는 상품 존재로 삭제 불가" },
            },
        },
    },
};