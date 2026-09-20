import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../lib/http-error";
import { resolveApiError } from "@gikan/shared";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
    if (err instanceof ZodError) {
        res.status(400).json({
            error: "Invalid data",
            code: "errors.invalidData",
            fields: err.flatten().fieldErrors,
            fieldCodes: err.issues.map((issue) => ({
                path: issue.path.join("."),
                code: `validation.${issue.code}`,
                minimum: "minimum" in issue ? issue.minimum : undefined,
                maximum: "maximum" in issue ? issue.maximum : undefined,
            })),
        });
        return;
    }

    if (err instanceof HttpError) {
        res.status(err.statusCode).json({ error: err.message, code: err.code, params: err.params });
        return;
    }

    if (typeof err === "object" && err !== null && "type" in err && err.type === "entity.too.large") {
        const message = "This document is too large to save. Split its content into smaller pages.";
        res.status(413).json({ error: message, ...resolveApiError(message, 413) });
        return;
    }

    console.error(err);
    res.status(500).json({ error: "Internal error", code: "errors.internal" });
}
