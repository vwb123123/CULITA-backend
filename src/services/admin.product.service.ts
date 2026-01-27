import { ProductImageType } from "@prisma/client";
import { prisma } from "../config/prisma";
import { deleteFileFromFirebase, uploadFileToFirebase } from "../utils/upload.utils";
import { CreateProductInput, UpdateProductInput } from "../schemas/admin.product.schema";
import { HttpException } from "../utils/exception.utils";

export class AdminProductService {
    async createProduct(data: CreateProductInput, files: Express.Multer.File[]) {
        const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
        if (!category) throw new HttpException(404, "존재하지 않는 카테고리입니다.");

        let metadata: { type: ProductImageType; order: number }[] = [];
        try {
            metadata = JSON.parse(data.imageMetadata);
        } catch (e) {
            throw new HttpException(400, "imageMetadata 형식이 올바르지 않습니다. (JSON Array required)");
        }

        if (files.length !== metadata.length) {
            throw new HttpException(400, "업로드된 파일 수와 메타데이터 수가 일치하지 않습니다.");
        }

        const uploadPromises = files.map((file) => uploadFileToFirebase(file, "products"));
        const imageUrls = await Promise.all(uploadPromises);

        return await prisma.$transaction(async (tx) => {
            const product = await tx.product.create({
                data: {
                    name: data.name,
                    description: data.description,
                    price: data.price,
                    stock: data.stock,
                    categoryId: data.categoryId,
                    isBest: data.isBest,
                    isNew: data.isNew,
                    productName: data.productName,
                    volume: data.volume,
                    efficacyEffects: data.efficacyEffects,
                    ingredients: data.ingredients,
                    manufacturer: data.manufacturer,
                    brandCompany: data.brandCompany,
                    precautions: data.precautions,
                },
            });

            const imageCreates = imageUrls.map((url, index) => ({
                productId: product.id,
                url: url,
                type: metadata[index].type, // MAIN, HOVER, DETAIL
                order: metadata[index].order,
            }));

            await tx.productImage.createMany({ data: imageCreates });

            return product;
        });
    }

    async updateProduct(id: number, data: UpdateProductInput) {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) throw new HttpException(404, "상품을 찾을 수 없습니다.");

        return await prisma.product.update({
            where: { id },
            data: { ...data },
        });
    }

    async deleteProduct(id: number) {
        const product = await prisma.product.findUnique({
            where: { id },
            include: { images: true },
        });

        if (!product) throw new HttpException(404, "상품을 찾을 수 없습니다.");

        const deletePromises = product.images.map((img) => deleteFileFromFirebase(img.url));
        await Promise.allSettled(deletePromises);

        await prisma.$transaction([
            prisma.productImage.deleteMany({ where: { productId: id } }),
            prisma.product.delete({ where: { id } }),
        ]);

        return { message: "상품 및 이미지가 삭제되었습니다.", deletedId: id };
    }
}