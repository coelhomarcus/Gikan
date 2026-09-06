import type { ReactNode } from "react";
import { ArrowLeft } from "@untitledui/icons";
import { ButtonUtility } from "@/components/base/buttons/button-utility";

interface TopbarProps {
    title?: ReactNode;
    actions?: ReactNode;
    onBack?: () => void;
}

export const Topbar = ({ title, actions, onBack }: TopbarProps) => {
    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-secondary px-4 lg:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-2">
                {onBack && <ButtonUtility icon={ArrowLeft} size="sm" color="tertiary" tooltip="Voltar" onClick={onBack} />}
                <div className="min-w-0 truncate text-md font-semibold text-primary">{title}</div>
            </div>
            {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
        </header>
    );
};
