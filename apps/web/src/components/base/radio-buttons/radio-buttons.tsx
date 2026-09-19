import type { ReactNode, Ref } from "react";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { Radio as BaseRadio } from "@base-ui/react/radio";
import { cx } from "@/utils/cx";

export interface RadioGroupContextType { size?: "sm" | "md" }
export interface RadioButtonBaseProps { size?: "sm" | "md"; className?: string; isFocusVisible?: boolean; isSelected?: boolean; isDisabled?: boolean }

export const RadioButtonBase = ({ className, isFocusVisible, isSelected, isDisabled, size = "sm" }: RadioButtonBaseProps) => <span aria-hidden className={cx("flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface-1 ring-1 ring-strong ring-inset", size === "md" && "size-5", isSelected && "bg-accent-primary ring-brand-solid", isDisabled && "cursor-not-allowed opacity-50", isFocusVisible && "outline-2 outline-offset-2 outline-accent-strong", className)}><span className={cx("size-1.5 rounded-full bg-fg-white opacity-0", size === "md" && "size-2", isSelected && "opacity-100")} /></span>;

interface RadioButtonProps {
    value?: string;
    size?: "sm" | "md";
    label?: ReactNode;
    hint?: ReactNode;
    ref?: Ref<HTMLButtonElement>;
    className?: string;
    disabled?: boolean;
    isDisabled?: boolean;
}

export const RadioButton = ({ label, hint, className, size = "sm", isDisabled, disabled, value, ...props }: RadioButtonProps) => <BaseRadio.Root {...props} value={value ?? ""} disabled={isDisabled ?? disabled} className={cx("flex items-start gap-2", className)}><BaseRadio.Indicator render={<RadioButtonBase size={size} isDisabled={isDisabled ?? disabled} />} />{(label || hint) && <span className="flex flex-col gap-1"><span className={cx("text-secondary select-none", size === "md" ? "text-md" : "text-sm")}>{label}</span>{hint && <span className={cx("text-tertiary", size === "md" ? "text-md" : "text-sm")}>{hint}</span>}</span>}</BaseRadio.Root>;

interface RadioGroupProps extends RadioGroupContextType { children: ReactNode; className?: string; value?: string; defaultValue?: string; onValueChange?: (value: string) => void; name?: string }
export const RadioGroup = ({ children, className, size = "sm", ...props }: RadioGroupProps) => <BaseRadioGroup {...props} className={cx("flex flex-col gap-4", className)} />;
