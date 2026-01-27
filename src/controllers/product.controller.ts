import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { ProductListQuery } from '../schemas/product.schema';

const productService = new ProductService();

export class ProductController {
    async getProducts(req: Request, res: Response, next: NextFunction) {
        try {
            const query = req.query as unknown as ProductListQuery;

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