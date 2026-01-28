import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { User } from '@prisma/client';

export const authenticateJwt = (req: Request, res: Response, next: NextFunction): void => {
    passport.authenticate('jwt', { session: false }, (err: Error | null, user: User | false, info: any) => {
        if (err) {
            return next(err);
        }

        if (!user) {
            const message = info ? info.message : 'Unauthorized access';
            res.status(401).json({ message });
            return;
        }

        req.user = user;
        next();
    })(req, res, next);
};