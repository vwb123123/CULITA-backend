import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";

const userService = new UserService();

export class UserController {
    async updateProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            const result = await userService.updateProfile(userId, req.body);
            res.status(200).json({ message: "정보가 수정되었습니다.", data: result });
        } catch (error) {
            next(error);
        }
    }

    async changePassword(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = (req as any).user.id;
            await userService.changePassword(userId, req.body);
            res.status(200).json({ message: "비밀번호가 변경되었습니다." });
        } catch (error) {
            next(error);
        }
    }
}
