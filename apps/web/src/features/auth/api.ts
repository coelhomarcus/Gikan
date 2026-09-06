import type { LoginInput, RegisterInput, UpdateProfileInput } from "@todokanban/shared";
import { apiClient } from "@/lib/api-client";

export interface AuthUser {
    id: string;
    name: string;
    username: string;
    email: string;
    avatarUrl: string | null;
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

export async function updateProfile(input: UpdateProfileInput): Promise<AuthUser> {
    const { user } = await apiClient.patch<{ user: AuthUser }>("/users/me", input);
    return user;
}
