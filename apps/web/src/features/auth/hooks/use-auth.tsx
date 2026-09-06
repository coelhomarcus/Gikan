import { useQuery } from "@tanstack/react-query";
import { createContext, type ReactNode, use } from "react";
import { ApiError } from "@/lib/api-client";
import { AUTH_QUERY_KEY, type AuthUser, fetchMe } from "../api";

interface AuthContextValue {
    user: AuthUser | null;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchMeOrNull(): Promise<AuthUser | null> {
    try {
        return await fetchMe();
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
            return null;
        }
        throw error;
    }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const { data, isLoading } = useQuery({
        queryKey: AUTH_QUERY_KEY,
        queryFn: fetchMeOrNull,
        retry: false,
        staleTime: Infinity,
    });

    return <AuthContext value={{ user: data ?? null, isLoading }}>{children}</AuthContext>;
};

export const useAuth = (): AuthContextValue => {
    const context = use(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
