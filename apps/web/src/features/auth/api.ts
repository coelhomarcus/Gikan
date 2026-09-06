import type { LoginInput, RegisterInput } from "@todokanban/shared";
import { apiClient } from "@/lib/api-client";

export interface AuthUser {
    id: string;
    name: string;
    username: string;
    email: string;
    isAdmin: boolean;
    createdAt: string;
    updatedAt: string;
}

export const AUTH_QUERY_KEY = ["auth", "me"] as const;

export async function fetchMe(): Promise<AuthUser> {
    const { user } = await apiClient.get<{ user: AuthUser }>("/auth/me");
    return user;
}

export async function login(input: LoginInput): Promise<AuthUser> {
    const { user } = await apiClient.post<{ user: AuthUser }>("/auth/login", input);
    return user;
}

export async function register(input: RegisterInput): Promise<AuthUser> {
    const { user } = await apiClient.post<{ user: AuthUser }>("/auth/register", input);
    return user;
}

export function logout(): Promise<void> {
    return apiClient.post<void>("/auth/logout");
}
