import { LoaderCircle } from "lucide-react";
import { cx } from "@/utils/cx";
import { useTranslation } from "react-i18next";

interface LoadingStateProps {
    label?: string;
    className?: string;
}

export const LoadingState = ({ label, className }: LoadingStateProps) => {
    const { t } = useTranslation();
    return (
        <div className={cx("flex items-center gap-2 text-sm text-tertiary", className)} role="status" aria-live="polite">
            <LoaderCircle className="size-4 animate-spin text-accent-primary" aria-hidden="true" />
            <span>{label ?? t("common.loading")}</span>
        </div>
    );
};
