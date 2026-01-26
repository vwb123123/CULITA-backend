import { prisma } from "../config/prisma";
import { HttpException } from "../utils/exception.utils";
import { AddToCartInput, UpdateCartItemInput } from "../schemas/cart.schema";
import { ProductImageType } from "@prisma/client";

export class CartService {
    private async getOrCreateCart(userId: number) {
        let cart = await prisma.cart.findUnique({ where: { userId } });
        if (!cart) {
            cart = await prisma.cart.create({ data: { userId } });
        }
        return cart;
    }

    async getCart(userId: number) {
        const cart = await this.getOrCreateCart(userId);

        const cartItems = await prisma.cartItem.findMany({
            where: { cartId: cart.id },
            include: {
                product: {
                    include: {
                        images: {
                            where: { type: ProductImageType.MAIN },
                            take: 1,
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        let cartTotal = 0;
        const formattedItems = cartItems.map((item) => {
            const totalPrice = item.quantity * item.product.price;
            cartTotal += totalPrice;

            return {
                id: item.id,
                quantity: item.quantity,
                product: {
                    id: item.product.id,
                    name: item.product.name,
                    price: item.product.price,
                    thumbnail: item.product.images[0]?.url || null,
                },
                totalPrice,
            };
        });

        return {
            id: cart.id,
            items: formattedItems,
            cartTotal,
        };
    }

    async addToCart(userId: number, data: AddToCartInput) {
        const cart = await this.getOrCreateCart(userId);

        const product = await prisma.product.findUnique({
            where: { id: data.productId },
        });
        if (!product) throw new HttpException(404, "존재하지 않는 상품입니다.");

        if (product.stock < data.quantity) {
            throw new HttpException(400, "재고가 부족합니다.");
        }

        await prisma.cartItem.upsert({
            where: {
                cartId_productId: {
                    cartId: cart.id,
                    productId: data.productId,
                },
            },
            update: {
                quantity: { increment: data.quantity },
            },
            create: {
                cartId: cart.id,
                productId: data.productId,
                quantity: data.quantity,
            },
        });

        return { message: "장바구니에 상품을 담았습니다." };
    }

    async updateItemQuantity(userId: number, itemId: number, data: UpdateCartItemInput) {
        const cartItem = await prisma.cartItem.findUnique({
            where: { id: itemId },
            include: { cart: true },
        });

        if (!cartItem || cartItem.cart.userId !== userId) {
            throw new HttpException(404, "해당 장바구니 아이템을 찾을 수 없습니다.");
        }

        await prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity: data.quantity },
        });

        return { message: "수량이 변경되었습니다." };
    }

    async removeItem(userId: number, itemId: number) {
        const cartItem = await prisma.cartItem.findUnique({
            where: { id: itemId },
            include: { cart: true },
        });

        if (!cartItem || cartItem.cart.userId !== userId) {
            throw new HttpException(404, "해당 장바구니 아이템을 찾을 수 없습니다.");
        }

        await prisma.cartItem.delete({
            where: { id: itemId },
        });

        return { message: "상품이 삭제되었습니다." };
    }
}