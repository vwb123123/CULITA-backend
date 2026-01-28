import { prisma } from "../config/prisma";
import { HttpException } from "../utils/exception.utils";
import { ProductListQuery } from "../schemas/product.schema";
import { ProductImageType, Prisma } from "@prisma/client";

export class ProductService {
    async getProducts(query: ProductListQuery) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const { categoryId, isBest, isNew, sort } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.ProductWhereInput = {};

        if (categoryId) {
            where.categoryId = categoryId;
        }
        if (isBest) {
            where.isBest = isBest === 'true';
        }
        if (isNew) {
            where.isNew = isNew === 'true';
        }

        let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' }; // 기본: 최신순
        if (sort === 'priceHigh') {
            orderBy = { price: 'desc' };
        } else if (sort === 'priceLow') {
            orderBy = { price: 'asc' };
        }

        const [total, products] = await prisma.$transaction([
            prisma.product.count({ where }),
            prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    images: {
                        where: {
                            type: { in: [ProductImageType.MAIN, ProductImageType.HOVER] }
                        }
                    }
                }
            }),
        ]);

        const totalPages = Math.ceil(total / limit);

        const formattedProducts = products.map(product => {
            const mainImage = product.images.find(img => img.type === ProductImageType.MAIN);
            const hoverImage = product.images.find(img => img.type === ProductImageType.HOVER);

            return {
                id: product.id,
                name: product.name,
                price: product.price,
                isBest: product.isBest,
                isNew: product.isNew,
                thumbnail: mainImage?.url || null,
                hoverImage: hoverImage?.url || null,
            };
        });

        return {
            data: formattedProducts,
            pagination: {
                total,
                totalPages,
                currentPage: page,
                limit,
            },
        };
    }

    async getProductById(id: number) {
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                category: true,
                images: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        if (!product) {
            throw new HttpException(404, "상품을 찾을 수 없습니다.");
        }

        return product;
    }
}