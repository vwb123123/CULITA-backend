import { Request, Response, NextFunction } from 'express';
import { CartService } from '../services/cart.service';

const cartService = new CartService();

export class CartController {
    async getCart(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const result = await cartService.getCart(userId);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async addToCart(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const result = await cartService.addToCart(userId, req.body);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async updateItem(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const itemId = Number(req.params.itemId);
            const result = await cartService.updateItemQuantity(userId, itemId, req.body);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async removeItem(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const itemId = Number(req.params.itemId);
            const result = await cartService.removeItem(userId, itemId);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}