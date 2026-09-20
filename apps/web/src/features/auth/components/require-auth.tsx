import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { LoadingState } from "@/components/feedback/loading-state";
import { useAuth } from "../hooks/use-auth";
import { useTranslation } from "react-i18next";

export const RequireAuth = ({ children }: { children: ReactNode }) => {
    const { t } = useTranslation();
    const { user, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <LoadingState label={t("auth.loadingSession")} className="flex min-h-dvh items-center justify-center bg-surface-1" />;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};
