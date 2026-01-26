import { prisma } from "../config/prisma";
import { HttpException } from "../utils/exception.utils";
import { CreateCategoryInput, UpdateCategoryInput } from "../schemas/admin.category.schema";

export class AdminCategoryService {
    async createCategory(data: CreateCategoryInput) {
        const existingPath = await prisma.category.findUnique({
            where: { path: data.path },
        });

        if (existingPath) {
            throw new HttpException(409, "이미 존재하는 경로(path)입니다.");
        }

        if (data.parentId) {
            const parent = await prisma.category.findUnique({
                where: { id: data.parentId },
            });
            if (!parent) {
                throw new HttpException(404, "부모 카테고리를 찾을 수 없습니다.");
            }
        }

        return await prisma.category.create({
            data: {
                name: data.name,
                path: data.path,
                parentId: data.parentId || null,
            },
        });
    }

    async updateCategory(categoryId: number, data: UpdateCategoryInput) {
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
        });

        if (!category) {
            throw new HttpException(404, "수정할 카테고리를 찾을 수 없습니다.");
        }

        if (data.path && data.path !== category.path) {
            const existingPath = await prisma.category.findUnique({
                where: { path: data.path },
            });
            if (existingPath) {
                throw new HttpException(409, "이미 사용 중인 경로(path)입니다.");
            }
        }

        if (data.parentId) {
            if (data.parentId === categoryId) {
                throw new HttpException(400, "자기 자신을 상위 카테고리로 지정할 수 없습니다.");
            }
            const parent = await prisma.category.findUnique({ where: { id: data.parentId } });
            if (!parent) throw new HttpException(404, "부모 카테고리가 존재하지 않습니다.");
        }

        return await prisma.category.update({
            where: { id: categoryId },
            data: { ...data },
        });
    }

    async deleteCategory(categoryId: number) {
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
            include: {
                _count: {
                    select: { children: true, products: true },
                },
            },
        });

        if (!category) {
            throw new HttpException(404, "삭제할 카테고리를 찾을 수 없습니다.");
        }

        if (category._count.children > 0) {
            throw new HttpException(400, "하위 카테고리가 존재하여 삭제할 수 없습니다. 하위 카테고리를 먼저 삭제하거나 이동해주세요.");
        }

        if (category._count.products > 0) {
            throw new HttpException(400, "해당 카테고리에 등록된 상품이 있어 삭제할 수 없습니다.");
        }

        await prisma.category.delete({
            where: { id: categoryId },
        });

        return { message: "카테고리가 성공적으로 삭제되었습니다.", deletedId: categoryId };
    }
}