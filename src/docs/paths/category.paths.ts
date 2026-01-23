export const categoryPaths = {
    "/api/categories": {
        get: {
            summary: "전체 카테고리 목록 조회 (계층형)",
            description: "최상위 카테고리부터 하위 카테고리까지 Tree 구조로 모든 카테고리를 반환합니다.",
            tags: ["Categories"],
            responses: {
                "200": {
                    description: "조회 성공",
                    content: {
                        "application/json": {
                            schema: {
                                type: "array",
                                items: { $ref: "#/components/schemas/CategoryResponse" },
                            },
                        },
                    },
                },
            },
        },
    },
    "/api/categories/{path}": {
        get: {
            summary: "카테고리 상세 정보 및 경로 조회",
            description: "path를 기준으로 특정 카테고리의 정보와 상위 이동 경로(Breadcrumbs)를 반환합니다.",
            tags: ["Categories"],
            parameters: [
                {
                    in: "path",
                    name: "path",
                    required: true,
                    schema: { type: "string" },
                    description: "카테고리 고유 경로 (예: shirts)",
                    example: "shirts",
                },
            ],
            responses: {
                "200": {
                    description: "조회 성공",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    category: {
                                        $ref: "#/components/schemas/CategoryResponse",
                                        description: "해당 카테고리 상세 정보 (하위 카테고리 포함)",
                                    },
                                    breadcrumbs: {
                                        type: "array",
                                        description: "상위 카테고리 경로 (Home > 대분류 > 중분류 ...)",
                                        items: { $ref: "#/components/schemas/Breadcrumb" },
                                    },
                                },
                            },
                        },
                    },
                },
                "404": {
                    description: "존재하지 않는 카테고리",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    message: { type: "string", example: "존재하지 않는 카테고리입니다." },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};