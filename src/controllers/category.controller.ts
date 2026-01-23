import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';

const categoryService = new CategoryService();

export class CategoryController {
    async getAllCategories(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await categoryService.getAllCategories();
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async getCategoryByPath(req: Request, res: Response, next: NextFunction) {
        try {
            const path = req.params.path as string;
            const result = await categoryService.getCategoryByPath(path);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}