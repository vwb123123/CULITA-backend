export const basicInfo = {
    openapi: '3.0.0',
    info: {
        title: 'GentleMonster Copy Project API',
        version: '1.0.0',
        description: 'GentleMonster 백엔드 API 문서입니다.',
    },
    servers: [
        {
            url: `http://localhost:${process.env.PORT}`,
            description: 'Local Development Server',
        },
    ],
};