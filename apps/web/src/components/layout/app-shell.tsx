import { Outlet } from "react-router";
import { Sidebar } from "./sidebar";

export const AppShell = () => {
    return (
        <div className="flex min-h-dvh bg-primary">
            <Sidebar />
            <main className="min-h-dvh min-w-0 flex-1">
                <Outlet />
            </main>
        </div>
    );
};
