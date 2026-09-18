import type { ComponentProps, ReactNode } from "react";
import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { cx } from "@/utils/cx";

interface ToggleBaseProps { size?: "sm" | "md"; slim?: boolean; className?: string; isHovered?: boolean; isFocusVisible?: boolean; isSelected?: boolean; isDisabled?: boolean }

export const ToggleBase = ({ className, isDisabled, isFocusVisible, isSelected, slim, size = "sm" }: ToggleBaseProps) => {
    const root = slim ? (size === "sm" ? "h-4 w-8" : "h-5 w-10") : size === "sm" ? "h-5 w-9 p-0.5" : "h-6 w-11 p-0.5";
    const thumb = slim ? (size === "sm" ? "size-4" : "size-5") : size === "sm" ? "size-4" : "size-5";
    return <span aria-hidden className={cx("flex cursor-pointer rounded-full bg-tertiary ring-[0.5px] ring-secondary outline-focus-ring transition duration-150 ring-inset", isSelected && "bg-brand-solid", isDisabled && "cursor-not-allowed opacity-50", isFocusVisible && "outline-2 outline-offset-2", slim && "ring-1", root, className)}><span className={cx("rounded-full bg-fg-white shadow-sm transition-transform", slim && "border border-toggle-border shadow-xs", thumb, isSelected && (size === "sm" ? "translate-x-4" : "translate-x-5"))} /></span>;
};

interface ToggleProps extends Omit<ComponentProps<typeof BaseSwitch.Root>, "children" | "checked" | "defaultChecked" | "disabled" | "onCheckedChange" | "className"> {
    className?: string;
    size?: "sm" | "md";
    label?: string;
    hint?: ReactNode;
    slim?: boolean;
    isSelected?: boolean;
    defaultSelected?: boolean;
    isDisabled?: boolean;
    onChange?: (selected: boolean) => void;
}

export const Toggle = ({ label, hint, className, size = "sm", slim, isSelected, defaultSelected, isDisabled, onChange, ...props }: ToggleProps) => (
    <BaseSwitch.Root {...props} checked={isSelected} defaultChecked={defaultSelected} disabled={isDisabled} onCheckedChange={(checked) => onChange?.(checked)} className={cx("flex w-max items-start gap-2", isDisabled && "cursor-not-allowed", className)}>
        <ToggleBase slim={slim} size={size} isDisabled={isDisabled} isSelected={isSelected} className={slim ? "mt-0.5" : ""} />
        {(label || hint) && <span className="flex flex-col gap-1"><span className={cx("text-secondary select-none", size === "md" ? "text-md" : "text-sm")}>{label}</span>{hint && <span className={cx("text-tertiary", size === "md" ? "text-md" : "text-sm")}>{hint}</span>}</span>}
    </BaseSwitch.Root>
);
