import type { ComponentProps, ReactElement, ReactNode } from "react";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { cx } from "@/utils/cx";

interface TooltipProps extends Omit<ComponentProps<typeof BaseTooltip.Root>, "children"> {
    title: ReactNode;
    description?: ReactNode;
    arrow?: boolean;
    delay?: number;
    offset?: number;
    placement?: string;
    children: ReactNode;
    isDisabled?: boolean;
}

export const Tooltip = ({ title, description, arrow = false, delay = 300, offset = 6, placement = "top", children, isDisabled, ...props }: TooltipProps) => {
    const side = placement.split(" ")[0] as "top" | "bottom" | "left" | "right";

    return (
        <BaseTooltip.Provider delay={delay}>
            <BaseTooltip.Root {...props} disabled={isDisabled}>
                <BaseTooltip.Trigger render={children as ReactElement} />
                <BaseTooltip.Portal>
                    <BaseTooltip.Positioner side={side} sideOffset={offset}>
                        <BaseTooltip.Popup className={cx("z-50 flex max-w-xs flex-col items-start gap-1 rounded-lg bg-primary-solid px-3 shadow-lg", description ? "py-3" : "py-2")}>
                            {arrow && <BaseTooltip.Arrow className="fill-bg-primary-solid" />}
                            <span className="text-xs font-semibold text-white">{title}</span>
                            {description && <span className="text-xs font-medium text-tooltip-supporting-text">{description}</span>}
                        </BaseTooltip.Popup>
                    </BaseTooltip.Positioner>
                </BaseTooltip.Portal>
            </BaseTooltip.Root>
        </BaseTooltip.Provider>
    );
};

export const TooltipTrigger = ({ children, className, isDisabled, ...props }: ComponentProps<typeof BaseTooltip.Trigger> & { isDisabled?: boolean }) => (
    <BaseTooltip.Trigger {...props} disabled={isDisabled} className={cx("h-max w-max outline-hidden", typeof className === "function" ? undefined : className)}>
        {children}
    </BaseTooltip.Trigger>
);
