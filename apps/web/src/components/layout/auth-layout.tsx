import { Outlet } from "react-router";
import { AppLogo } from "@/components/foundations/logo/app-logo";

export const AuthLayout = () => {
    return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-primary px-4 py-12">
            <AppLogo />
            <div className="w-full max-w-sm">
                <Outlet />
            </div>
        </div>
    );
};
