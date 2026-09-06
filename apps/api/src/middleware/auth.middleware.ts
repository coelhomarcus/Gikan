import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/jwt";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    const token = req.cookies?.tk_session as string | undefined;

    if (!token) {
        res.status(401).json({ error: "Não autenticado" });
        return;
    }

    try {
        req.user = verifyToken(token);
        next();
    } catch {
        res.status(401).json({ error: "Sessão inválida ou expirada" });
    }
}
