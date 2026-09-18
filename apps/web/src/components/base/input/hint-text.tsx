import type { HTMLAttributes, ReactNode, Ref } from "react";
import { cx } from "@/utils/cx";

interface HintTextProps extends HTMLAttributes<HTMLElement> {
    /** Indicates that the hint text is an error message. */
    isInvalid?: boolean;
    ref?: Ref<HTMLElement>;
    size?: "sm" | "md";
    children: ReactNode;
}

export const HintText = ({ isInvalid, className, size = "md", ...props }: HintTextProps) => {
    return (
        <span
            {...props}
            className={cx(
                "text-sm text-tertiary",

                // Size
                size === "sm" && "text-xs",
                "in-data-[input-size=sm]:text-xs",

                // Invalid state
                isInvalid && "text-error-primary",
                "group-invalid:text-error-primary",

                className,
            )}
        />
    );
};

HintText.displayName = "HintText";
