import { prisma } from "../config/prisma";
import { HttpException } from "../utils/exception.utils";
import { Prisma } from "@prisma/client";
import { CreateInquiryInput, GetInquiryListQuery, UpdateInquiryInput, } from "../schemas/inquiry.schema";

export class UserInquiryService {
    // --- 1. 문의 등록 ---
    async createInquiry(userId: number, data: CreateInquiryInput) {
        return await prisma.$transaction(async tx => {
            return await tx.inquiry.create({
                data: {
                    userId,
                    type: data.type,
                    title: data.title,
                    content: data.content,
                    status: "PENDING",
                    images: {
                        create: data.imageUrls?.map(url => ({ url })) || [],
                    },
                },
                include: { images: true },
            });
        });
    }

    // --- 2. 내 문의 목록 조회 ---
    async getMyInquiries(userId: number, query: GetInquiryListQuery) {
        const { page, limit, type, status } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.InquiryWhereInput = { userId };

        if (type) where.type = type;
        if (status) where.status = status;

        const [total, inquiries] = await Promise.all([
            prisma.inquiry.count({ where }),
            prisma.inquiry.findMany({
                where,
                include: { images: true },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
        ]);

        return {
            data: inquiries,
            pagination: {
                total,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                limit,
            },
        };
    }

    // --- 3. 문의 상세 조회 ---
    async getInquiryDetail(userId: number, inquiryId: number) {
        const inquiry = await prisma.inquiry.findUnique({
            where: { id: inquiryId },
            include: { images: true },
        });

        if (!inquiry || inquiry.userId !== userId) {
            throw new HttpException(404, "문의를 찾을 수 없습니다.");
        }

        return inquiry;
    }

    // --- 4. 문의 수정 (답변 전만 가능) ---
    async updateInquiry(userId: number, inquiryId: number, data: UpdateInquiryInput) {
        const inquiry = await prisma.inquiry.findUnique({ where: { id: inquiryId } });

        if (!inquiry || inquiry.userId !== userId) {
            throw new HttpException(404, "문의를 찾을 수 없습니다.");
        }

        if (inquiry.status === "ANSWERED") {
            throw new HttpException(400, "이미 답변이 완료된 문의는 수정할 수 없습니다.");
        }

        return await prisma.$transaction(async tx => {
            // 이미지 업데이트 (기존 삭제 -> 재생성)
            if (data.imageUrls) {
                await tx.inquiryImage.deleteMany({ where: { inquiryId } });
                await tx.inquiryImage.createMany({
                    data: data.imageUrls.map(url => ({ inquiryId, url })),
                });
            }

            return await tx.inquiry.update({
                where: { id: inquiryId },
                data: {
                    type: data.type,
                    title: data.title,
                    content: data.content,
                },
                include: { images: true },
            });
        });
    }

    // --- 5. 문의 삭제 (답변 전만 가능) ---
    async deleteInquiry(userId: number, inquiryId: number) {
        const inquiry = await prisma.inquiry.findUnique({ where: { id: inquiryId } });

        if (!inquiry || inquiry.userId !== userId) {
            throw new HttpException(404, "문의를 찾을 수 없습니다.");
        }

        if (inquiry.status === "ANSWERED") {
            throw new HttpException(
                400,
                "이미 답변이 완료된 문의는 삭제할 수 없습니다. (보관 필요)",
            );
        }

        await prisma.inquiry.delete({ where: { id: inquiryId } });

        return { message: "문의가 삭제되었습니다.", deletedId: inquiryId };
    }
}
