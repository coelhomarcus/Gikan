import { Outlet } from "react-router";
import { Sidebar } from "./sidebar";

export const AppShell = () => {
    return (
        <div className="min-h-dvh bg-primary lg:flex">
            <Sidebar />
            <main className="min-h-dvh min-w-0 lg:flex-1">
                <Outlet />
            </main>
        </div>
    );
};
