import { Request, Response, NextFunction } from "express";
import { AdminInquiryService } from "../services/admin.inquiry.service";
import { GetAdminInquiryListQuery } from "../schemas/admin.inquiry.schema";
import { InquiryStatus, InquiryType } from "@prisma/client";

const inquiryService = new AdminInquiryService();

export class AdminInquiryController {
    // 전체 조회
    async getAllInquiries(req: Request, res: Response, next: NextFunction) {
        try {
            const { page, limit, type, status, search, startDate, endDate } = req.query;
            const query: GetAdminInquiryListQuery = {
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 10,
                type: type as InquiryType | undefined,
                status: status as InquiryStatus | undefined,
                search: search as string | undefined,
                startDate: startDate as string | undefined,
                endDate: endDate as string | undefined,
            };
            const result = await inquiryService.getAllInquiries(query);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    // 상세 조회
    async getInquiryDetail(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            const result = await inquiryService.getInquiryDetail(id);
            res.status(200).json({ message: "상세 조회 성공", data: result });
        } catch (error) {
            next(error);
        }
    }

    // 답변 등록
    async answerInquiry(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            const result = await inquiryService.answerInquiry(id, req.body);
            res.status(200).json({ message: "답변이 등록되었습니다.", data: result });
        } catch (error) {
            next(error);
        }
    }

    // 삭제
    async deleteInquiry(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            const result = await inquiryService.deleteInquiry(id);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}
