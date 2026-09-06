import type { NextFunction, Request, Response } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
    if (!req.user?.isAdmin) {
        res.status(403).json({ error: "Acesso restrito a administradores" });
        return;
    }
    next();
}
