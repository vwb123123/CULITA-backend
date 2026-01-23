import { Request, Response, NextFunction } from 'express';
import { AdminCategoryService } from '../services/admin.category.service';

const adminCategoryService = new AdminCategoryService();

export class AdminCategoryController {
    async createCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await adminCategoryService.createCategory(req.body);
            res.status(201).json({ message: '카테고리 생성 성공', data: result });
        } catch (error) {
            next(error);
        }
    }

    async updateCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            const result = await adminCategoryService.updateCategory(id, req.body);
            res.status(200).json({ message: '카테고리 수정 성공', data: result });
        } catch (error) {
            next(error);
        }
    }

    async deleteCategory(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            const result = await adminCategoryService.deleteCategory(id);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}