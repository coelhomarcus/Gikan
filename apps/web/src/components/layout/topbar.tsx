import type { ReactNode } from "react";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { AppIcons } from "@/components/foundations/icons";
import { useAppNavigation } from "./app-shell";

interface TopbarProps {
    title?: ReactNode;
    actions?: ReactNode;
    onBack?: () => void;
}
export function Topbar({ title, actions, onBack }: TopbarProps) {
    const { toggleSidebar } = useAppNavigation();
    return (
        <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-subtle px-4">
            <div className="flex min-w-0 items-center gap-2">
                <ButtonUtility icon={AppIcons.Menu} color="tertiary" tooltip="Toggle navigation" onClick={toggleSidebar} />
                {onBack && <ButtonUtility icon={AppIcons.Back} color="tertiary" tooltip="Go back" onClick={onBack} />}
                <div className="min-w-0 truncate text-sm font-medium text-primary">{title}</div>
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
    );
}
