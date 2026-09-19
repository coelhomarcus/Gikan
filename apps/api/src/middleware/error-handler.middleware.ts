import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../lib/http-error";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
    if (err instanceof ZodError) {
        res.status(400).json({ error: "Invalid data", fields: err.flatten().fieldErrors });
        return;
    }

    if (err instanceof HttpError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
    }

    if (typeof err === "object" && err !== null && "type" in err && err.type === "entity.too.large") {
        res.status(413).json({ error: "This document is too large to save. Split its content into smaller pages." });
        return;
    }

    console.error(err);
    res.status(500).json({ error: "Internal error" });
}
