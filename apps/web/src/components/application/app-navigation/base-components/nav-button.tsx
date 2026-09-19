import type { FC, MouseEventHandler, ReactNode } from "react";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { cx } from "@/utils/cx";

interface NavButtonProps {
    /** Whether the collapsible nav item is open. */
    open?: boolean;
    /** URL to navigate to when the button is clicked. */
    href?: string;
    /** Label text for the button. */
    label?: string;
    /** Icon component to display. */
    icon?: FC<{ className?: string }>;
    /** Whether the button is currently active. */
    current?: boolean;
    /** Handler for click events. */
    onClick?: MouseEventHandler;
    /** Additional CSS classes to apply to the button. */
    className?: string;
    /** Placement of the tooltip. */
    tooltipPlacement?: "top" | "right" | "bottom" | "left";
    /** Content to display. */
    children?: ReactNode;
}

export const NavButton = ({ current, label, href, icon: Icon, className, tooltipPlacement = "right", onClick, children }: NavButtonProps) => {
    const iconOnly = !children;

    return (
        <Tooltip isDisabled={!label} title={label} placement={tooltipPlacement}>
            <a
                    href={href}
                    aria-label={label}
                    onClick={onClick}
                    className={cx(
                        "group/item relative flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-surface-1 px-3 outline-accent-strong transition duration-100 ease-linear select-none hover:bg-layer-1-hover focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2",
                        current && "bg-surface-2 hover:bg-layer-2-hover",
                        iconOnly ? "size-9 p-0" : "",
                        className,
                    )}
                >
                    {Icon && (
                        <Icon
                            aria-hidden="true"
                            className={cx(
                                "size-4 shrink-0 text-placeholder transition-inherit-all group-hover/item:text-secondary",
                                current && "text-secondary",
                            )}
                        />
                    )}

                    {children && (
                        <span
                            className={cx(
                                "px-0.5 text-sm font-semibold transition duration-100 ease-linear group-hover/item:text-primary",
                                current && "text-primary",
                            )}
                        >
                            {children}
                        </span>
                    )}
            </a>
        </Tooltip>
    );
};
