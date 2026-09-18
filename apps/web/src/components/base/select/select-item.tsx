import { isValidElement, useContext } from "react";
import { Check } from "lucide-react";
import { Select as BaseSelect } from "@base-ui/react/select";
import { Avatar } from "@/components/base/avatar/avatar";
import { CheckboxBase } from "@/components/base/checkbox/checkbox";
import { cx } from "@/utils/cx";
import { isReactComponent } from "@/utils/is-react-component";
import { SelectContext, sizes, type SelectItemType } from "./select-shared";

interface SelectItemProps extends SelectItemType {
    value?: string | number;
    selectionIndicator?: "checkmark" | "checkbox" | "none";
    selectionIndicatorAlign?: "left" | "right";
    children?: React.ReactNode;
    className?: string;
}

export const SelectItem = ({
    label,
    id,
    value,
    avatarUrl,
    supportingText,
    isDisabled,
    icon: Icon,
    className,
    children,
    selectionIndicator = "checkmark",
    selectionIndicatorAlign = "right",
}: SelectItemProps) => {
    const { size } = useContext(SelectContext);
    const text = label ?? (typeof children === "string" ? children : "");
    const isLeft = selectionIndicatorAlign === "left";

    return (
        <BaseSelect.Item
            value={value ?? id}
            label={text}
            disabled={isDisabled}
            className={(state) => cx("w-full rounded-md outline-none", "data-[highlighted]:bg-primary_hover", "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50", state.highlighted && "bg-primary_hover", className)}
        >
            <div className={cx("flex cursor-pointer items-center select-none", sizes[size].root)}>
                {isLeft && selectionIndicator === "checkbox" && <CheckboxBase size={size === "lg" ? "md" : "sm"} />}
                {avatarUrl && <Avatar aria-hidden="true" size="xs" src={avatarUrl} alt={label} />}
                {isReactComponent(Icon) && <Icon data-icon aria-hidden="true" />}
                {isValidElement(Icon) && Icon}
                <span className={cx("flex min-w-0 flex-1 flex-wrap", sizes[size].textContainer)}>
                    <span className={cx("truncate font-medium whitespace-nowrap text-primary", sizes[size].text)}>{children ?? label}</span>
                    {supportingText && <span className={cx("whitespace-nowrap text-tertiary", sizes[size].text)}>{supportingText}</span>}
                </span>
                {selectionIndicator === "checkmark" && <BaseSelect.ItemIndicator className="ml-auto"><Check aria-hidden="true" className="size-4 text-fg-brand-primary" /></BaseSelect.ItemIndicator>}
                {!isLeft && selectionIndicator === "checkbox" && <BaseSelect.ItemIndicator className="ml-auto"><CheckboxBase size={size === "lg" ? "md" : "sm"} /></BaseSelect.ItemIndicator>}
            </div>
        </BaseSelect.Item>
    );
};
