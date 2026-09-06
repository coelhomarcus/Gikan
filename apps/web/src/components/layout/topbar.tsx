import type { ReactNode } from "react";

interface TopbarProps {
    title?: ReactNode;
    actions?: ReactNode;
}

export const Topbar = ({ title, actions }: TopbarProps) => {
    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-secondary px-4 lg:px-6">
            <div className="min-w-0 flex-1 truncate text-md font-semibold text-primary">{title}</div>
            {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
        </header>
    );
};
