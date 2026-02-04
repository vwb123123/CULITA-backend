import { prisma } from "../config/prisma";
import { HttpException } from "../utils/exception.utils";
import { Prisma } from "@prisma/client";
import { GetAdminInquiryListQuery, AnswerInquiryInput } from "../schemas/admin.inquiry.schema";

export class AdminInquiryService {
    // --- 1. 전체 문의 목록 조회 ---
    async getAllInquiries(query: GetAdminInquiryListQuery) {
        const { page, limit, type, status, search, startDate, endDate } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.InquiryWhereInput = {};

        if (type) where.type = type;
        if (status) where.status = status;

        // 검색 (회원명, 이메일, 제목)
        if (search) {
            where.OR = [
                { user: { name: { contains: search } } },
                { user: { email: { contains: search } } },
                { title: { contains: search } },
            ];
        }

        // 날짜 필터
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(`${startDate}T00:00:00.000Z`);
            if (endDate) where.createdAt.lte = new Date(`${endDate}T23:59:59.999Z`);
        }

        const [total, inquiries] = await Promise.all([
            prisma.inquiry.count({ where }),
            prisma.inquiry.findMany({
                where,
                include: {
                    user: { select: { id: true, name: true, email: true } }, // 문의자 정보 포함
                    images: true,
                },
                orderBy: { createdAt: "desc" }, // 최신순
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

    // --- 2. 문의 상세 조회 ---
    async getInquiryDetail(inquiryId: number) {
        const inquiry = await prisma.inquiry.findUnique({
            where: { id: inquiryId },
            include: {
                user: { select: { id: true, name: true, email: true } },
                images: true,
            },
        });

        if (!inquiry) {
            throw new HttpException(404, "문의를 찾을 수 없습니다.");
        }

        return inquiry;
    }

    // --- 3. 답변 등록 (상태 변경 포함) ---
    async answerInquiry(inquiryId: number, data: AnswerInquiryInput) {
        const inquiry = await prisma.inquiry.findUnique({ where: { id: inquiryId } });
        if (!inquiry) throw new HttpException(404, "문의를 찾을 수 없습니다.");

        return await prisma.inquiry.update({
            where: { id: inquiryId },
            data: {
                answer: data.answer,
                status: "ANSWERED", // 상태를 '답변 완료'로 변경
                answeredAt: new Date(), // 현재 시간 기록
            },
        });
    }

    // --- 4. 문의 삭제 ---
    async deleteInquiry(inquiryId: number) {
        const inquiry = await prisma.inquiry.findUnique({ where: { id: inquiryId } });
        if (!inquiry) throw new HttpException(404, "문의를 찾을 수 없습니다.");

        await prisma.inquiry.delete({ where: { id: inquiryId } });
        return { message: "관리자 권한으로 문의가 삭제되었습니다.", deletedId: inquiryId };
    }
}
