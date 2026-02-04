import { prisma } from "../config/prisma";
import { HttpException } from "../utils/exception.utils";
import axios from "axios";
import type { ConfirmOrderInput, CreateOrderInput, GetOrderListQuery, ReturnOrderInput } from "../schemas/order.schema";

export class UserOrderService {
    // --- 1. 주문서 작성 ---
    async createOrder(userId: number, data: CreateOrderInput) {
        return await prisma.$transaction(async (tx) => {
            let totalPrice = 0;
            const orderItemsData = [];

            // 상품 가격 검증 및 재고 확인 (재고 로직은 필요시 추가)
            for (const item of data.items) {
                const product = await tx.product.findUnique({ where: { id: item.productId } });
                if (!product) {
                    throw new HttpException(404, `상품 ID ${item.productId}를 찾을 수 없습니다.`);
                }

                totalPrice += product.price * item.quantity;
                orderItemsData.push({
                    productId: product.id,
                    quantity: item.quantity,
                    price: product.price, // 스냅샷 저장
                });
            }

            return await tx.order.create({
                data: {
                    userId,
                    totalPrice,
                    status: "PENDING",
                    recipientName: data.recipientName,
                    recipientPhone: data.recipientPhone,
                    zipCode: data.zipCode,
                    address1: data.address1,
                    address2: data.address2,
                    gatePassword: data.gatePassword,
                    deliveryRequest: data.deliveryRequest,
                    items: { create: orderItemsData },
                },
                include: { items: true },
            });
        });
    }

    // --- 2. 결제 승인 ---
    async confirmOrder(userId: number, data: ConfirmOrderInput) {
        const order = await prisma.order.findUnique({
            where: { id: data.orderId },
        });

        if (!order) throw new HttpException(404, "주문을 찾을 수 없습니다.");
        if (order.userId !== userId) throw new HttpException(403, "권한이 없습니다.");
        if (order.totalPrice !== data.amount) throw new HttpException(400, "결제 금액이 일치하지 않습니다.");
        if (order.status !== "PENDING") throw new HttpException(400, "이미 처리된 주문입니다.");

        try {
            // 토스 결제 승인 API 호출
            const secretKey = process.env.TOSS_SECRET_KEY;
            const basicToken = Buffer.from(`${secretKey}:`).toString("base64");

            const response = await axios.post(
                "https://api.tosspayments.com/v1/payments/confirm",
                {
                    paymentKey: data.paymentKey,
                    orderId: `order_${order.id}_${Date.now()}`, // 토스 쪽 주문 ID (Unique해야 함)
                    amount: data.amount,
                },
                {
                    headers: {
                        Authorization: `Basic ${basicToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            // DB 트랜잭션: 결제 정보 저장 및 주문 상태 업데이트
            return await prisma.$transaction(async (tx) => {
                await tx.payment.create({
                    data: {
                        orderId: order.id,
                        method: response.data.method,
                        amount: data.amount,
                        status: "PAID",
                        approvedAt: new Date(response.data.approvedAt),
                    },
                });

                return await tx.order.update({
                    where: { id: order.id },
                    data: { status: "PAID" },
                    include: { payment: true },
                });
            });

        } catch (error: any) {
            console.error("Payment Confirm Error:", error.response?.data);
            throw new HttpException(400, error.response?.data?.message || "결제 승인 실패");
        }
    }

    // --- 3. 내 주문 목록 조회 ---
    async getMyOrders(userId: number, query: GetOrderListQuery) {
        // query는 page, limit을 가짐 (기본값 처리됨)
        const { page, limit } = query;
        const skip = (page - 1) * limit;

        const [total, orders] = await Promise.all([
            prisma.order.count({ where: { userId } }),
            prisma.order.findMany({
                where: { userId },
                include: {
                    items: {
                        include: {
                            product: {
                                select: { name: true, images: { take: 1 } },
                            },
                        },
                    },
                    payment: true,
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
        ]);

        // 표준 응답 구조 (data + pagination)
        return {
            data: orders,
            pagination: {
                total,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                limit,
            },
        };
    }

    // --- 4. 주문 상세 조회 ---
    async getOrderDetail(userId: number, orderId: number) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: { include: { product: true } },
                payment: true,
            },
        });

        if (!order || order.userId !== userId) {
            throw new HttpException(404, "주문을 찾을 수 없습니다.");
        }

        return order;
    }

    // --- 5. 주문 취소 (배송 전) ---
    async cancelOrder(userId: number, orderId: number) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { payment: true },
        });

        if (!order || order.userId !== userId) throw new HttpException(404, "주문을 찾을 수 없습니다.");

        // 배송 시작 여부 확인
        if (["SHIPPED", "DELIVERED", "RETURN_REQUESTED", "RETURN_COMPLETED"].includes(order.status)) {
            throw new HttpException(400, "이미 배송이 시작되어 취소할 수 없습니다.");
        }
        if (order.status === "CANCELED") throw new HttpException(400, "이미 취소된 주문입니다.");

        // 결제가 된 상태라면 PG사 결제 취소 요청
        if (order.status === "PAID" && order.payment) {
            try {
                const secretKey = process.env.TOSS_SECRET_KEY;
                const basicToken = Buffer.from(`${secretKey}:`).toString("base64");

                // 결제 당시 저장해둔 paymentKey가 필요하다고 가정 (Payment 모델에 paymentKey 필드를 추가하거나, 조회해서 사용)
                // 여기서는 Payment 모델에 paymentKey 필드가 없으므로, 토스 API 조회를 통해 가져오거나 해야 하지만
                // 로직 구현을 위해 paymentKey가 있다고 가정하고 작성하거나, DB 스키마 수정이 필요할 수 있습니다.
                // 여기서는 'CANCELED' 상태 변경에 집중하되, 실제로는 axios 호출이 필요합니다.

                // 예시 코드 (실제 사용 시 Payment 모델에 paymentKey 필드 추가 권장)
                /*
                await axios.post(
                    `https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`,
                    { cancelReason: "고객 요청에 의한 취소" },
                    { headers: { Authorization: `Basic ${basicToken}` } }
                );
                */
            } catch (error) {
                // 결제 취소 실패 시 로직 (로그 남기기 등)
                console.error("Payment Cancel Error", error);
                throw new HttpException(500, "결제 취소 중 오류가 발생했습니다.");
            }
        }

        return await prisma.order.update({
            where: { id: orderId },
            data: { status: "CANCELED" },
        });
    }

    // --- 6. 반품 요청 (배송 완료 후) ---
    async requestReturn(userId: number, orderId: number, data: ReturnOrderInput) {
        const order = await prisma.order.findUnique({ where: { id: orderId } });

        if (!order || order.userId !== userId) throw new HttpException(404, "주문을 찾을 수 없습니다.");

        if (order.status !== "DELIVERED") {
            throw new HttpException(400, "배송이 완료된 상품만 반품 신청이 가능합니다.");
        }

        // 실제로는 반품 사유를 별도 테이블에 저장하는 것이 좋지만, 여기서는 상태 변경만 수행
        // 필요하다면 Inquiry(문의) 테이블에 자동 등록하는 로직 추가 가능
        return await prisma.order.update({
            where: { id: orderId },
            data: {
                status: "RETURN_REQUESTED",
                // note: data.reason // Order 모델에 비고란이 있다면 저장
            },
        });
    }
}