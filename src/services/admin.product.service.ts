import { prisma } from "../config/prisma";
import { deleteFileFromFirebase } from "../utils/upload.utils";
import { CreateProductInput, UpdateProductInput } from "../schemas/admin.product.schema";
import { HttpException } from "../utils/exception.utils";

export class AdminProductService {
    async createProduct(data: CreateProductInput) {
        const categoryId = Number(data.categoryId);
        const category = await prisma.category.findUnique({ where: { id: categoryId } });
        if (!category) throw new HttpException(404, "존재하지 않는 카테고리입니다.");

        return await prisma.$transaction(async tx => {
            const { images, ...productData } = data;

            return await tx.product.create({
                data: {
                    ...productData,
                    categoryId: categoryId,
                    price: Number(productData.price),
                    stock: Number(productData.stock),
                    images: {
                        create: images.map(img => ({
                            url: img.url,
                            type: img.type,
                            order: Number(img.order),
                        })),
                    },
                },
                include: { images: true },
            });
        });
    }

    async updateProduct(id: number, data: UpdateProductInput) {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) throw new HttpException(404, "상품을 찾을 수 없습니다.");

        return await prisma.$transaction(async tx => {
            const { images, ...productData } = data;

            const updateData: any = { ...productData };

            if (updateData.price !== undefined) updateData.price = Number(updateData.price);
            if (updateData.stock !== undefined) updateData.stock = Number(updateData.stock);
            if (updateData.categoryId !== undefined)
                updateData.categoryId = Number(updateData.categoryId);

            const updatedProduct = await tx.product.update({
                where: { id },
                data: updateData,
            });

            if (images) {
                await tx.productImage.deleteMany({ where: { productId: id } });

                if (images.length > 0) {
                    await tx.productImage.createMany({
                        data: images.map(img => ({
                            productId: id,
                            url: img.url,
                            type: img.type,
                            order: Number(img.order),
                        })),
                    });
                }
            }

            return updatedProduct;
        });
    }

    async deleteProduct(id: number) {
        const product = await prisma.product.findUnique({
            where: { id },
            include: { images: true },
        });

        if (!product) throw new HttpException(404, "상품을 찾을 수 없습니다.");

        const deletePromises = product.images.map(img => deleteFileFromFirebase(img.url));
        await Promise.allSettled(deletePromises);

        await prisma.$transaction([
            prisma.productImage.deleteMany({ where: { productId: id } }),
            prisma.product.delete({ where: { id } }),
        ]);

        return { message: "상품 및 이미지가 삭제되었습니다.", deletedId: id };
    }
}
