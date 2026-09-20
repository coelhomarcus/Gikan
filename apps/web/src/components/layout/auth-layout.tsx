import { Suspense } from "react";
import { Outlet } from "react-router";
import { Skeleton } from "@/components/base/feedback/skeleton";
import { GikanLogo } from "@/components/foundations/logo/gikan-logo";
import { LanguageSelector } from "@/i18n/language-selector";
import { useTranslation } from "react-i18next";

export function AuthLayout() {
    const { t } = useTranslation();
    return (
        <div className="flex min-h-dvh flex-col bg-canvas text-primary">
            <header className="flex items-center justify-between px-6 py-6 md:px-10">
                <GikanLogo />
                <LanguageSelector compact />
            </header>
            <main className="flex flex-1 items-center justify-center px-6 pb-16">
                <div className="w-full max-w-[360px]">
                    <Suspense
                        fallback={
                            <div className="space-y-4" role="status" aria-label={t("auth.loadingPage")}>
                                <Skeleton className="h-7 w-40" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-9 w-full" />
                            </div>
                        }
                    >
                        <Outlet />
                    </Suspense>
                </div>
            </main>
            <footer className="px-6 py-5 text-center text-xs text-placeholder">{t("auth.footer")}</footer>
        </div>
    );
}
