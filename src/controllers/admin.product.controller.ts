import { Request, Response, NextFunction } from 'express';
import { AdminProductService } from "../services/admin.product.service";

const adminProductService = new AdminProductService();

export class AdminProductController {
    async createProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const files = req.files as Express.Multer.File[];

            if (!files || files.length === 0) {
                throw new Error("이미지 파일이 없습니다.");
            }

            const result = await adminProductService.createProduct(req.body, files);

            res.status(201).json({ message: '상품 등록 성공', data: result });
        } catch (error) {
            next(error);
        }
    }

    async updateProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            const result = await adminProductService.updateProduct(id, req.body);
            res.status(200).json({ message: '상품 수정 성공', data: result });
        } catch (error) {
            next(error);
        }
    }

    async deleteProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            const result = await adminProductService.deleteProduct(id);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}