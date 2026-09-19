import { LoaderCircle } from "lucide-react";
import { cx } from "@/utils/cx";

interface LoadingStateProps {
    label?: string;
    className?: string;
}

export const LoadingState = ({ label = "Loading...", className }: LoadingStateProps) => (
    <div className={cx("flex items-center gap-2 text-sm text-tertiary", className)} role="status" aria-live="polite">
        <LoaderCircle className="size-4 animate-spin text-accent-primary" aria-hidden="true" />
        <span>{label}</span>
    </div>
);
