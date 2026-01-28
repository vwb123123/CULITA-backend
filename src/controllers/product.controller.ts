import { Request, Response, NextFunction } from "express";
import { ProductService } from "../services/product.service";
import { ProductListQuery } from "../schemas/product.schema";

const productService = new ProductService();

export class ProductController {
    async getProducts(req: Request, res: Response, next: NextFunction) {
        try {
            const query: ProductListQuery = {
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 10,
                categoryId: req.query.categoryId ? Number(req.query.categoryId) : undefined,
                isBest: req.query.isBest as "true" | "false" | undefined,
                isNew: req.query.isNew as "true" | "false" | undefined,
                sort: (req.query.sort as any) || "latest",
            };

            const result = await productService.getProducts(query);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async getProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const id = Number(req.params.id);
            const result = await productService.getProductById(id);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}
