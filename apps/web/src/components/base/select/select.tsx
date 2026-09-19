import type { FC, ReactNode, RefAttributes } from "react";
import { useId } from "react";
import { Select as BaseSelect } from "@base-ui/react/select";
import { ChevronDown } from "lucide-react";
import { Avatar } from "@/components/base/avatar/avatar";
import { HintText } from "@/components/base/input/hint-text";
import { Label } from "@/components/base/input/label";
import { cx } from "@/utils/cx";
import { isReactComponent } from "@/utils/is-react-component";
import { ComboBox } from "./combobox";
import { SelectItem } from "./select-item";
import { type CommonProps, SelectContext, type SelectItemType, sizes } from "./select-shared";

export { SelectContext, sizes, type CommonProps, type SelectItemType } from "./select-shared";

export interface SelectProps extends RefAttributes<HTMLDivElement>, CommonProps {
    items?: SelectItemType[];
    popoverClassName?: string;
    icon?: FC | ReactNode;
    selectedKey?: string | number | null;
    defaultSelectedKey?: string | number | null;
    value?: string | number | null;
    defaultValue?: string | number | null;
    onSelectionChange?: (key: string | number | null) => void;
    onChange?: (value: string | number | null) => void;
    isDisabled?: boolean;
    isRequired?: boolean;
    isInvalid?: boolean;
    className?: string;
    "aria-label"?: string;
    children: ReactNode | ((item: SelectItemType) => ReactNode);
}

const SelectValue = ({
    icon,
    size,
    placeholder,
    items,
}: {
    icon?: FC | ReactNode;
    size: "sm" | "md" | "lg";
    placeholder?: string;
    items: SelectItemType[];
}) => (
    <BaseSelect.Value
        className={cx("flex min-w-0 flex-1 items-center gap-2 truncate text-left", "*:data-icon:size-4", sizes[size].text)}
        placeholder={placeholder}
    >
        {(value) => {
            const selected = value as SelectItemType | string | number | null;
            const selectedItem = (typeof selected === "object" && selected ? selected : items.find((item) => item.id === selected)) ?? null;
            const Icon = selectedItem?.icon ?? icon;

            return (
                <>
                    {selectedItem?.avatarUrl && <Avatar size="xs" src={selectedItem.avatarUrl} alt={selectedItem.label} />}
                    {isReactComponent(Icon) && <Icon data-icon aria-hidden="true" />}
                    <span className={cx("min-w-0 truncate font-medium text-primary", sizes[size].text)}>
                        {selectedItem?.label ?? (typeof selected === "string" || typeof selected === "number" ? String(selected) : placeholder)}
                    </span>
                </>
            );
        }}
    </BaseSelect.Value>
);

const Select = ({
    placeholder = "Select",
    icon,
    size = "md",
    children,
    items = [],
    label,
    hint,
    tooltip,
    hideRequiredIndicator,
    className,
    popoverClassName,
    selectedKey,
    defaultSelectedKey,
    value,
    defaultValue,
    onSelectionChange,
    onChange,
    isDisabled,
    isRequired,
    isInvalid,
    "aria-label": ariaLabel,
    ...rest
}: SelectProps) => {
    const selectedValue = selectedKey !== undefined ? selectedKey : value;
    const initialValue = defaultSelectedKey !== undefined ? defaultSelectedKey : defaultValue;
    const triggerId = useId();
    const renderedItems = typeof children === "function" ? items.map((item) => children(item)) : children;

    return (
        <SelectContext.Provider value={{ size }}>
            <BaseSelect.Root
                {...rest}
                value={selectedValue}
                defaultValue={initialValue}
                items={items.map((item) => ({ value: item.id, label: item.label ?? String(item.id) }))}
                disabled={isDisabled}
                required={isRequired}
                onValueChange={(nextValue) => {
                    onSelectionChange?.(nextValue);
                    onChange?.(nextValue);
                }}
                aria-label={ariaLabel}
            >
                <div className={cx("flex flex-col gap-2", className)} data-invalid={isInvalid || undefined}>
                    {label && (
                        <Label htmlFor={triggerId} isRequired={hideRequiredIndicator ? false : isRequired} isInvalid={isInvalid} tooltip={tooltip}>
                            {label}
                        </Label>
                    )}
                    <BaseSelect.Trigger
                        id={triggerId}
                        aria-label={ariaLabel ?? label}
                        className={cx(
                            "shadow-xs relative flex w-full cursor-pointer items-center rounded-md bg-surface-1 ring-1 ring-strong outline-hidden transition duration-100 ease-linear ring-inset",
                            "focus-visible:ring-2 focus-visible:ring-accent-strong",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            sizes[size].root,
                        )}
                        aria-invalid={isInvalid || undefined}
                    >
                        <SelectValue icon={icon} size={size} placeholder={placeholder} items={items} />
                        <BaseSelect.Icon className="ml-auto shrink-0 text-placeholder">
                            <ChevronDown aria-hidden="true" className={size === "lg" ? "size-5" : "size-4 stroke-[2.25px]"} />
                        </BaseSelect.Icon>
                    </BaseSelect.Trigger>
                    <BaseSelect.Portal>
                        <BaseSelect.Positioner className="z-50 outline-none" sideOffset={4}>
                            <BaseSelect.Popup
                                className={cx(
                                    "shadow-lg min-w-(--anchor-width) origin-(--transform-origin) overflow-hidden rounded-md bg-surface-1 p-1 ring-1 ring-secondary_alt outline-none",
                                    "data-[side=bottom]:animate-in data-[side=bottom]:fade-in data-[side=bottom]:slide-in-from-top-1",
                                    "data-[side=top]:animate-in data-[side=top]:fade-in data-[side=top]:slide-in-from-bottom-1",
                                    popoverClassName,
                                )}
                            >
                                <BaseSelect.List className="max-h-72 overflow-y-auto outline-none">{renderedItems}</BaseSelect.List>
                            </BaseSelect.Popup>
                        </BaseSelect.Positioner>
                    </BaseSelect.Portal>
                    {hint && <HintText isInvalid={isInvalid}>{hint}</HintText>}
                </div>
            </BaseSelect.Root>
        </SelectContext.Provider>
    );
};

const _Select = Select as typeof Select & {
    ComboBox: typeof ComboBox;
    Item: typeof SelectItem;
};
_Select.ComboBox = ComboBox;
_Select.Item = SelectItem;

export { _Select as Select };
