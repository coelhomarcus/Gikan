import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../lib/http-error";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
    if (err instanceof ZodError) {
        res.status(400).json({ error: "Dados inválidos", fields: err.flatten().fieldErrors });
        return;
    }

    if (err instanceof HttpError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
    }

    console.error(err);
    res.status(500).json({ error: "Erro interno" });
}
