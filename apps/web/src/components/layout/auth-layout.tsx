import { Suspense } from "react";
import { Outlet } from "react-router";
import { Skeleton } from "@/components/base/feedback/skeleton";
import { GikanLogo } from "@/components/foundations/logo/gikan-logo";

export function AuthLayout() {
    return (
        <div className="flex min-h-dvh flex-col bg-canvas text-primary">
            <header className="px-6 py-6 md:px-10">
                <GikanLogo />
            </header>
            <main className="flex flex-1 items-center justify-center px-6 pb-16">
                <div className="w-full max-w-[360px]">
                    <Suspense
                        fallback={
                            <div className="space-y-4" role="status" aria-label="Loading authentication page">
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
            <footer className="px-6 py-5 text-center text-xs text-placeholder">Gikan · Your projects, in one place.</footer>
        </div>
    );
}
