import type { ReactNode } from "react";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { AppIcons } from "@/components/foundations/icons";

interface TopbarProps {
    title?: ReactNode;
    actions?: ReactNode;
    onBack?: () => void;
}

export const Topbar = ({ title, actions, onBack }: TopbarProps) => {
    return (
        <header className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-secondary px-3 lg:px-4">
            <div className="flex min-w-0 flex-1 items-center gap-2">
                {onBack && <ButtonUtility icon={AppIcons.Back} size="sm" color="tertiary" tooltip="Go back" onClick={onBack} />}
                <div className="min-w-0 truncate text-sm font-semibold text-primary">{title}</div>
            </div>
            {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
        </header>
    );
};
