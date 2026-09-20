import { resolveApiError } from "@gikan/shared";

export class HttpError extends Error {
    statusCode: number;
    code: string;
    params?: Record<string, string>;

    constructor(statusCode: number, message: string, code?: string, params?: Record<string, string>) {
        super(message);
        this.statusCode = statusCode;
        const resolved = resolveApiError(message, statusCode);
        this.code = code ?? resolved.code;
        this.params = params ?? resolved.params;
    }
}
