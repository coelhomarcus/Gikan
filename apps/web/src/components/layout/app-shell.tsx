import { Outlet } from "react-router";
import { Sidebar } from "./sidebar";

export const AppShell = () => {
    return (
        <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-primary lg:flex-row">
            <Sidebar />
            <main className="min-h-0 min-w-0 flex-1 overflow-hidden bg-primary">
                <Outlet />
            </main>
        </div>
    );
};
