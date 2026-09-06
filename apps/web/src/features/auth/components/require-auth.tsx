import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../hooks/use-auth";

export const RequireAuth = ({ children }: { children: ReactNode }) => {
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return null;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};
