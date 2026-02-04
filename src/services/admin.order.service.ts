import { prisma } from "../config/prisma";
import { HttpException } from "../utils/exception.utils";
import { Prisma } from "@prisma/client";
import { GetAdminOrderListQuery, UpdateOrderStatusInput } from "../schemas/admin.order.schema";
import "../schemas/admin.order.schema";

export class AdminOrderService {

    // --- 1. 전체 주문 조회 (검색 및 필터) ---
    async getAllOrders(query: GetAdminOrderListQuery) {
        const { page, limit, status, search, startDate, endDate } = query;
        const skip = (page - 1) * limit;

        // 동적 쿼리 조건 생성
        const where: Prisma.OrderWhereInput = {};

        if (status) {
            where.status = status;
        }

        if (search) {
            // 주문자 이름, 이메일, 수령인 이름으로 검색
            where.OR = [
                { user: { name: { contains: search } } },
                { user: { email: { contains: search } } },
                { recipientName: { contains: search } },
            ];
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`);
            if (endDate) where.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`);
        }

        const [total, orders] = await Promise.all([
            prisma.order.count({ where }),
            prisma.order.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, email: true } }, // 주문자 정보 포함
                    payment: { select: { method: true, status: true, amount: true } },
                    _count: { select: { items: true } } // 상품 개수만 요약 표시
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
        ]);

        return {
            orders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    // --- 2. 주문 상세 조회 ---
    async getOrderDetail(orderId: number) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                user: { select: { id: true, name: true, email: true, } },
                items: {
                    include: {
                        product: { select: { name: true, price: true, images: { take: 1 } } }
                    }
                },
                payment: true,
            },
        });

        if (!order) {
            throw new HttpException(404, "주문을 찾을 수 없습니다.");
        }

        return order;
    }

    // --- 3. 주문 상태 변경 ---
    async updateOrderStatus(orderId: number, data: UpdateOrderStatusInput) {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (!order) throw new HttpException(404, "주문을 찾을 수 없습니다.");

        // 배송 시작(SHIPPED)인데 송장번호가 없으면 에러 혹은 경고 (여기선 로직만 처리)
        // 비즈니스 로직: 배송 완료나 반품 완료 처리는 신중해야 함.

        return await prisma.order.update({
            where: { id: orderId },
            data: {
                status: data.status,
                trackingNumber: data.trackingNumber || order.trackingNumber, // 입력 없으면 유지
                carrier: data.carrier || order.carrier,
            },
        });
    }
}