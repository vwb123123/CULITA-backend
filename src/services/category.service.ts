import { prisma } from "../config/prisma";
import { HttpException } from "../utils/exception.utils";

export class CategoryService {
    async getAllCategories() {
        return await prisma.category.findMany({
            where: {
                parentId: null,
            },
            include: {
                children: {
                    include: {
                        children: true,
                    },
                    orderBy: { id: "asc" },
                },
            },
            orderBy: { id: "asc" },
        });
    }

    async getCategoryByPath(path: string) {
        const category = await prisma.category.findUnique({
            where: { path: path },
            include: {
                parent: {
                    include: {
                        parent: true,
                    },
                },
                children: true,
            },
        });

        if (!category) {
            throw new HttpException(404, "존재하지 않는 카테고리입니다.");
        }

        const breadcrumbs = [];
        let current: any = category;

        while (current) {
            breadcrumbs.unshift({
                id: current.id,
                name: current.name,
                path: current.path,
            });
            current = current.parent;
        }

        const { parent, ...categoryData } = category;

        return {
            category: categoryData,
            breadcrumbs: breadcrumbs,
        };
    }
}