import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/utils/cx";

export const Field = ({ className, ...props }: ComponentProps<"div">) => <div {...props} className={cx("flex flex-col gap-2", className)} />;

export const FieldGroup = ({ className, ...props }: ComponentProps<"div">) => <div {...props} className={cx("flex flex-col gap-4", className)} />;

export const FieldLabel = ({ className, ...props }: ComponentProps<"label">) => <label {...props} className={cx("text-sm font-medium text-secondary", className)} />;

export const FieldDescription = ({ className, ...props }: ComponentProps<"p">) => <p {...props} className={cx("text-xs leading-5 text-tertiary", className)} />;

export const FieldError = ({ children, className, ...props }: Omit<ComponentProps<"p">, "children"> & { children?: ReactNode }) => {
    if (!children) return null;
    return <p {...props} role="alert" className={cx("text-xs leading-5 text-error-primary", className)}>{children}</p>;
};

export const FieldContent = ({ className, ...props }: ComponentProps<"div">) => <div {...props} className={cx("flex min-w-0 flex-1 flex-col gap-1", className)} />;
