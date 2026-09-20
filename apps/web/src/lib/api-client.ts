import i18n from "@/i18n/i18n";

export class ApiError extends Error {
    status: number;
    fields?: Record<string, string[]>;
    code?: string;
    params?: Record<string, string>;
    fieldCodes?: Array<{ path: string; code: string; minimum?: number; maximum?: number }>;
    readonly rawMessage: string;

    constructor(status: number, message: string, fields?: Record<string, string[]>, code?: string, params?: Record<string, string>, fieldCodes?: ApiError["fieldCodes"]) {
        super();
        this.status = status;
        this.fields = fields;
        this.code = code;
        this.params = params;
        this.fieldCodes = fieldCodes;
        this.rawMessage = message;
        this.name = "ApiError";
    }

    override get message() {
        return this.code ? i18n.t(this.code as "errors.requestFailed", { ...this.params, defaultValue: this.rawMessage }) : this.rawMessage;
    }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`/api${path}`, {
        ...init,
        credentials: "include",
        headers: {
            ...(init?.body ? { "Content-Type": "application/json" } : {}),
            ...init?.headers,
        },
    });

    if (response.status === 204) {
        return undefined as T;
    }

    const data = await response.json().catch(() => undefined);

    if (!response.ok) {
        throw new ApiError(response.status, data?.error ?? "Unexpected error", data?.fields, data?.code, data?.params, data?.fieldCodes);
    }

    return data as T;
}

export const apiClient = {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
    patch: <T>(path: string, body?: unknown, signal?: AbortSignal) => request<T>(path, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined, signal }),
    delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
