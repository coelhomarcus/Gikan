import type { CSSProperties, ChangeEvent, ReactNode, Ref, TextareaHTMLAttributes } from "react";
import { useId } from "react";
import { HintText } from "@/components/base/input/hint-text";
import { Label } from "@/components/base/input/label";
import { cx } from "@/utils/cx";

const getResizeHandleBg = (color: string) =>
    `url(data:image/svg+xml;base64,${btoa(`<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 2L2 10" stroke="${color}" stroke-linecap="round"/><path d="M11 7L7 11" stroke="${color}" stroke-linecap="round"/></svg>`)})`;

interface TextAreaBaseProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size" | "onChange"> {
    ref?: Ref<HTMLTextAreaElement>;
    size?: "sm" | "md";
    isInvalid?: boolean;
    isDisabled?: boolean;
    onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
}

export const TextAreaBase = ({ className, size = "md", isInvalid, isDisabled, style, ...props }: TextAreaBaseProps) => (
    <textarea
        {...props}
        disabled={isDisabled}
        style={{ ...style, "--resize-handle-bg": getResizeHandleBg("#D5D7DA"), "--resize-handle-bg-dark": getResizeHandleBg("#373A41") } as CSSProperties}
        className={cx(
            "shadow-xs min-h-24 w-full scroll-py-3 rounded-md bg-surface-1 px-3 py-2.5 text-primary ring-1 ring-strong transition duration-100 ease-linear ring-inset placeholder:text-placeholder focus:outline-hidden",
            size === "sm" && "text-sm",
            size === "md" && "text-md",
            "[&::-webkit-resizer]:bg-(image:--resize-handle-bg) [&::-webkit-resizer]:bg-contain dark:[&::-webkit-resizer]:bg-(image:--resize-handle-bg-dark)",
            "focus:ring-2 focus:ring-accent-strong",
            isDisabled && "cursor-not-allowed opacity-50",
            isInvalid && "ring-danger-subtle",
            className,
        )}
    />
);
TextAreaBase.displayName = "TextAreaBase";

interface TextFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "className"> {
    label?: ReactNode;
    hint?: ReactNode;
    tooltip?: string;
    size?: TextAreaBaseProps["size"];
    textAreaClassName?: string;
    ref?: Ref<HTMLDivElement>;
    textAreaRef?: TextAreaBaseProps["ref"];
    hideRequiredIndicator?: boolean;
    placeholder?: string;
    rows?: number;
    cols?: number;
    className?: string;
    isInvalid?: boolean;
    isDisabled?: boolean;
    isRequired?: boolean;
    onChange?: (value: string) => void;
}

export const TextArea = ({
    label,
    hint,
    tooltip,
    textAreaRef,
    hideRequiredIndicator,
    textAreaClassName,
    placeholder,
    className,
    rows,
    cols,
    size = "md",
    isInvalid,
    isDisabled,
    isRequired,
    onChange,
    ...props
}: TextFieldProps) => {
    const generatedId = useId();
    const textAreaId = props.id ?? generatedId;
    return (
        <div className={cx("group flex h-max w-full flex-col items-start justify-start gap-2", className)}>
            {label && (
                <Label htmlFor={textAreaId} isRequired={hideRequiredIndicator ? false : isRequired} tooltip={tooltip}>
                    {label}
                </Label>
            )}
            <TextAreaBase
                {...props}
                id={textAreaId}
                placeholder={placeholder}
                className={textAreaClassName}
                ref={textAreaRef}
                rows={rows}
                cols={cols}
                size={size}
                isInvalid={isInvalid}
                isDisabled={isDisabled}
                required={isRequired}
                onChange={(event) => onChange?.(event.currentTarget.value)}
            />
            {hint && (
                <HintText isInvalid={isInvalid} size={size}>
                    {hint}
                </HintText>
            )}
        </div>
    );
};
TextArea.displayName = "TextArea";
