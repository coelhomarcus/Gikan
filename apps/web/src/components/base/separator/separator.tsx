import type { ComponentProps } from "react";
import { cx } from "@/utils/cx";

export const Separator = ({ orientation = "horizontal", className, ...props }: ComponentProps<"div"> & { orientation?: "horizontal" | "vertical" }) => (
    <div {...props} role="separator" aria-orientation={orientation} className={cx("shrink-0 bg-border-secondary", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className)} />
);
