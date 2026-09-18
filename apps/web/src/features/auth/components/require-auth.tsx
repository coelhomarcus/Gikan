import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { LoadingState } from "@/components/feedback/loading-state";
import { useAuth } from "../hooks/use-auth";

export const RequireAuth = ({ children }: { children: ReactNode }) => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <LoadingState label="Loading your session..." className="flex min-h-dvh items-center justify-center bg-primary" />;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};
