export class ApiError extends Error {
    status: number;
    fields?: Record<string, string[]>;

    constructor(status: number, message: string, fields?: Record<string, string[]>) {
        super(message);
        this.status = status;
        this.fields = fields;
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
        throw new ApiError(response.status, data?.error ?? "Erro inesperado", data?.fields);
    }

    return data as T;
}

export const apiClient = {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
    patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
    delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
