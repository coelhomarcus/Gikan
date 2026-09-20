import type { ComponentType, HTMLAttributes, InputHTMLAttributes, ReactNode, Ref } from "react";
import { createContext, useContext, useId, useState } from "react";
import { Input as BaseInput } from "@base-ui/react/input";
import { Eye, EyeOff, CircleQuestionMark as HelpCircle, Info } from "lucide-react";
import { controlScale } from "@/components/base/control-scale";
import { HintText } from "@/components/base/input/hint-text";
import { Label } from "@/components/base/input/label";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";
import { cx, sortCx } from "@/utils/cx";
import { useTranslation } from "react-i18next";

type InputState = { isRequired?: boolean; isInvalid?: boolean; isDisabled?: boolean };

export interface InputBaseProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "value"> {
    tooltip?: string;
    isInvalid?: boolean;
    isDisabled?: boolean;
    isRequired?: boolean;
    size?: "sm" | "md" | "lg";
    iconClassName?: string;
    inputClassName?: string;
    wrapperClassName?: string;
    tooltipClassName?: string;
    shortcut?: string | boolean;
    ref?: Ref<HTMLInputElement>;
    groupRef?: Ref<HTMLDivElement>;
    icon?: ComponentType<HTMLAttributes<HTMLOrSVGElement>>;
    value?: string;
}

const TextFieldContext = createContext<Pick<InputBaseProps, "size" | "wrapperClassName" | "inputClassName" | "iconClassName" | "tooltipClassName">>({});

export const InputBase = ({
    ref,
    tooltip,
    shortcut,
    groupRef,
    size = "md",
    isInvalid,
    isDisabled,
    isRequired,
    icon: Icon,
    placeholder,
    wrapperClassName,
    tooltipClassName,
    inputClassName,
    iconClassName,
    type = "text",
    ...inputProps
}: InputBaseProps) => {
    const { t } = useTranslation();
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const context = useContext(TextFieldContext);
    const inputSize = context.size || size;
    const hasTrailingIcon = Boolean(tooltip || isInvalid);
    const hasLeadingIcon = Boolean(Icon);
    const sizes = sortCx({
        sm: {
            root: cx(controlScale.field.sm, hasLeadingIcon && "pl-9", hasTrailingIcon && "pr-9"),
            iconLeading: "left-3 size-4",
            iconTrailing: "right-3",
            shortcut: "pr-1.5",
        },
        md: {
            root: cx(controlScale.field.md, hasLeadingIcon && "pl-10", hasTrailingIcon && "pr-9"),
            iconLeading: "left-3 size-4",
            iconTrailing: "right-3",
            shortcut: "pr-2",
        },
        lg: {
            root: cx(controlScale.field.lg, hasLeadingIcon && "pl-10", hasTrailingIcon && "pr-9"),
            iconLeading: "left-3 size-4",
            iconTrailing: "right-3",
            shortcut: "pr-2.5",
        },
    });

    return (
        <div
            ref={groupRef}
            data-disabled={isDisabled || undefined}
            data-invalid={isInvalid || undefined}
            className={cx(
                "group/input shadow-xs relative flex w-full flex-row place-content-center place-items-center rounded-md bg-surface-1 ring-1 ring-strong transition-shadow duration-100 ease-linear ring-inset",
                "focus-within:ring-2 focus-within:ring-accent-strong",
                isDisabled && "cursor-not-allowed opacity-50",
                isInvalid && "ring-danger-subtle",
                context.wrapperClassName,
                wrapperClassName,
            )}
        >
            {Icon && (
                <Icon className={cx("pointer-events-none absolute text-placeholder", sizes[inputSize].iconLeading, context.iconClassName, iconClassName)} />
            )}
            <BaseInput
                {...inputProps}
                ref={ref}
                disabled={isDisabled}
                required={isRequired}
                type={type === "password" && isPasswordVisible ? "text" : type}
                placeholder={placeholder}
                className={cx(
                    "m-0 w-full bg-transparent text-primary ring-0 outline-hidden placeholder:text-placeholder autofill:rounded-md autofill:text-primary disabled:cursor-not-allowed",
                    sizes[inputSize].root,
                    context.inputClassName,
                    inputClassName,
                )}
            />
            {tooltip && type !== "password" && (
                <Tooltip title={tooltip} placement="top">
                    <TooltipTrigger
                        className={cx(
                            "absolute cursor-pointer text-placeholder hover:text-secondary",
                            sizes[inputSize].iconTrailing,
                            context.tooltipClassName,
                            tooltipClassName,
                        )}
                    >
                        <HelpCircle className="size-4 stroke-[2.25px]" />
                    </TooltipTrigger>
                </Tooltip>
            )}
            {isInvalid && type !== "password" && (
                <Info
                    className={cx(
                        "pointer-events-none absolute size-4 text-danger-secondary",
                        sizes[inputSize].iconTrailing,
                        context.tooltipClassName,
                        tooltipClassName,
                    )}
                />
            )}
            {type === "password" && (
                <button
                    type="button"
                    aria-label={t("common.togglePassword")}
                    onClick={() => setIsPasswordVisible((visible) => !visible)}
                    className={cx(
                        "absolute flex cursor-pointer items-center justify-center text-placeholder hover:text-secondary",
                        sizes[inputSize].iconTrailing,
                    )}
                >
                    {isPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
            )}
            {shortcut && (
                <div
                    className={cx(
                        "pointer-events-none absolute inset-y-0.5 right-0.5 z-10 hidden items-center rounded-r-[inherit] bg-linear-to-r from-transparent to-bg-primary to-40% pl-8 md:flex",
                        sizes[inputSize].shortcut,
                    )}
                >
                    <span className="rounded px-1 py-px text-xs font-medium text-placeholder ring-1 ring-subtle ring-inset">
                        {typeof shortcut === "string" ? shortcut : "⌘K"}
                    </span>
                </div>
            )}
        </div>
    );
};
InputBase.displayName = "InputBase";

export interface TextFieldProps extends Omit<InputBaseProps, "onChange" | "children"> {
    className?: string;
    children?: ReactNode | ((state: InputState) => ReactNode);
    onChange?: (value: string) => void;
}

export const TextField = ({
    className,
    size = "md",
    inputClassName,
    wrapperClassName,
    iconClassName,
    tooltipClassName,
    children,
    isRequired,
    isInvalid,
    isDisabled,
    onChange,
    ...props
}: TextFieldProps) => (
    <TextFieldContext.Provider value={{ inputClassName, wrapperClassName, iconClassName, tooltipClassName, size }}>
        <div data-input-wrapper data-input-size={size} className={cx("group flex h-max w-full flex-col items-start justify-start gap-2", className)}>
            {typeof children === "function" ? children({ isRequired, isInvalid, isDisabled }) : children}
            {!children && (
                <InputBase
                    {...props}
                    size={size}
                    isRequired={isRequired}
                    isInvalid={isInvalid}
                    isDisabled={isDisabled}
                    onChange={(event) => onChange?.(event.currentTarget.value)}
                />
            )}
        </div>
    </TextFieldContext.Provider>
);
TextField.displayName = "TextField";

export interface InputProps extends Omit<TextFieldProps, "children"> {
    label?: string;
    hint?: ReactNode;
    hideRequiredIndicator?: boolean;
    inputProps?: Pick<InputHTMLAttributes<HTMLInputElement>, "role" | "aria-controls" | "aria-activedescendant" | "aria-expanded">;
}

export const Input = ({
    size = "md",
    placeholder,
    icon: Icon,
    label,
    hint,
    shortcut,
    hideRequiredIndicator,
    inputProps,
    className,
    ref,
    groupRef,
    tooltip,
    iconClassName,
    inputClassName,
    wrapperClassName,
    tooltipClassName,
    type = "text",
    isRequired,
    isInvalid,
    isDisabled,
    onChange,
    ...props
}: InputProps) => {
    const generatedId = useId();
    const inputId = props.id ?? generatedId;
    return (
        <TextField
            {...props}
            aria-label={!label ? placeholder : undefined}
            size={size}
            className={className}
            isRequired={isRequired}
            isInvalid={isInvalid}
            isDisabled={isDisabled}
        >
            {({ isRequired: required, isInvalid: invalid }) => (
                <>
                    {label && (
                        <Label htmlFor={inputId} isRequired={hideRequiredIndicator ? false : required} isInvalid={invalid}>
                            {label}
                        </Label>
                    )}
                    <InputBase
                        ref={ref}
                        groupRef={groupRef}
                        size={size}
                        placeholder={placeholder}
                        icon={Icon}
                        shortcut={shortcut}
                        iconClassName={iconClassName}
                        inputClassName={inputClassName}
                        wrapperClassName={wrapperClassName}
                        tooltipClassName={tooltipClassName}
                        tooltip={tooltip}
                        type={type}
                        isRequired={required}
                        isInvalid={invalid}
                        isDisabled={isDisabled}
                        {...inputProps}
                        {...props}
                        id={inputId}
                        onChange={(event) => onChange?.(event.currentTarget.value)}
                    />
                    {hint && <HintText isInvalid={invalid}>{hint}</HintText>}
                </>
            )}
        </TextField>
    );
};
Input.displayName = "Input";
