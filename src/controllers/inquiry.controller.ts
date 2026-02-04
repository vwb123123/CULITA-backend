import { Request, Response, NextFunction } from "express";
import { UserInquiryService } from "../services/inquiry.service";
import { GetInquiryListQuery } from "../schemas/inquiry.schema";

const inquiryService = new UserInquiryService();

export class UserInquiryController {
    // 문의 등록
    async createInquiry(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await inquiryService.createInquiry(req.user!.id, req.body);
            res.status(201).json({ message: "문의가 등록되었습니다.", data: result });
        } catch (error) {
            next(error);
        }
    }

    // 내 문의 목록 조회
    async getMyInquiries(req: Request, res: Response, next: NextFunction) {
        try {
            // 미들웨어 Coercion 후 타입 단언
            const query = req.query as unknown as GetInquiryListQuery;
            const result = await inquiryService.getMyInquiries(req.user!.id, query);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    // 문의 상세 조회
    async getInquiryDetail(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            const result = await inquiryService.getInquiryDetail(req.user!.id, id);
            res.status(200).json({ message: "상세 조회 성공", data: result });
        } catch (error) {
            next(error);
        }
    }

    // 문의 수정
    async updateInquiry(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            const result = await inquiryService.updateInquiry(req.user!.id, id, req.body);
            res.status(200).json({ message: "문의가 수정되었습니다.", data: result });
        } catch (error) {
            next(error);
        }
    }

    // 문의 삭제
    async deleteInquiry(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            const result = await inquiryService.deleteInquiry(req.user!.id, id);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}
