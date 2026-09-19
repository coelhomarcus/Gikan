import type { ComponentProps, ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { cx } from "@/utils/cx";

type AlertTone = "error" | "success" | "warning" | "info";

const icons = { error: AlertCircle, success: CheckCircle2, warning: TriangleAlert, info: Info } satisfies Record<AlertTone, typeof AlertCircle>;
const toneClasses: Record<AlertTone, string> = {
    error: "border-danger-subtle bg-danger-subtle/10 text-danger-primary",
    success: "border-fg-success-primary/40 bg-success-primary/10 text-success-primary",
    warning: "border-fg-warning-primary/40 bg-warning-primary/10 text-warning-primary",
    info: "border-subtle bg-surface-2 text-secondary",
};

export const Alert = ({ tone = "info", children, className, ...props }: ComponentProps<"div"> & { tone?: AlertTone; children: ReactNode }) => {
    const Icon = icons[tone];
    return <div {...props} role={tone === "error" ? "alert" : "status"} className={cx("flex items-start gap-2 rounded-lg border px-4 py-3 text-sm", toneClasses[tone], className)}><Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><div className="min-w-0">{children}</div></div>;
};
