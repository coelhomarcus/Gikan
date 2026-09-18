import { Outlet } from "react-router";
import { GikanLogo } from "@/components/foundations/logo/gikan-logo";

export const AuthLayout = () => {
    return (
        <div className="min-h-dvh bg-primary text-primary">
            <div className="mx-auto grid min-h-dvh w-full max-w-6xl items-center gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16 lg:px-8">
                <div className="hidden lg:block">
                    <GikanLogo />
                    <div className="mt-16 max-w-md">
                        <p className="font-mono text-xs uppercase tracking-[0.16em] text-fg-brand-primary">A focused workspace</p>
                        <h1 className="mt-4 text-display-sm font-semibold tracking-tight text-primary">Keep the work moving.</h1>
                        <p className="mt-4 max-w-sm text-md leading-relaxed text-tertiary">Projects, issues, and the context behind them — organized in one calm workspace.</p>
                    </div>
                </div>

                <main className="w-full">
                    <div className="mb-8 lg:hidden">
                        <GikanLogo />
                    </div>
                    <div className="rounded-xl border border-secondary bg-secondary_alt/40 p-6 shadow-2xl sm:p-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
