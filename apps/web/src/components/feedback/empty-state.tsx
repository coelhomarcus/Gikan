import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
    title: string;
    description?: string;
    action?: ReactNode;
}

export const EmptyState = ({ title, description, action }: EmptyStateProps) => (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-secondary px-6 py-14 text-center">
        <span className="mb-3 flex size-9 items-center justify-center rounded-md bg-secondary text-fg-quaternary">
            <Inbox className="size-4" aria-hidden="true" />
        </span>
        <p className="text-sm font-semibold text-primary">{title}</p>
        {description && <p className="mt-1 max-w-sm text-sm text-tertiary">{description}</p>}
        {action && <div className="mt-4">{action}</div>}
    </div>
);
