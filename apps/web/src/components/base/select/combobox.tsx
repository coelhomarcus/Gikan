import type { FC, ReactNode, RefAttributes } from "react";
import { useContext, useId } from "react";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { ChevronDown, Search } from "lucide-react";
import { Avatar } from "@/components/base/avatar/avatar";
import { HintText } from "@/components/base/input/hint-text";
import { Label } from "@/components/base/input/label";
import { cx } from "@/utils/cx";
import { isReactComponent } from "@/utils/is-react-component";
import type { SelectItemType } from "./select-shared";
import { SelectContext, sizes } from "./select-shared";

interface ComboBoxProps extends RefAttributes<HTMLDivElement> {
    items?: SelectItemType[];
    children: ReactNode | ((item: SelectItemType) => ReactNode);
    placeholder?: string;
    label?: string;
    hint?: string;
    tooltip?: string;
    size?: "sm" | "md" | "lg";
    shortcut?: boolean;
    shortcutClassName?: string;
    popoverClassName?: string;
    icon?: FC | ReactNode;
    selectedKey?: string | number | null;
    value?: string | number | null;
    defaultValue?: string | number | null;
    onSelectionChange?: (key: string | number | null) => void;
    onValueChange?: (key: string | number | null) => void;
    isDisabled?: boolean;
    isInvalid?: boolean;
    isRequired?: boolean;
    className?: string;
}

export const ComboBox = ({
    items = [],
    children,
    placeholder = "Search",
    label,
    hint,
    tooltip,
    size = "md",
    shortcut = false,
    shortcutClassName,
    popoverClassName,
    icon,
    selectedKey,
    value,
    defaultValue,
    onSelectionChange,
    onValueChange,
    isDisabled,
    isInvalid,
    isRequired,
    className,
}: ComboBoxProps) => {
    const selectedValue = selectedKey !== undefined ? selectedKey : value;
    const inputId = useId();
    const renderedItems = typeof children === "function" ? items.map((item) => children(item)) : children;
    const IconComponent = isReactComponent(icon) ? (icon as FC) : null;
    const iconNode = IconComponent ? null : (icon as ReactNode | undefined);

    return (
        <SelectContext.Provider value={{ size }}>
            <BaseCombobox.Root
                items={items.map((item) => ({ value: item.id, label: item.label ?? String(item.id) }))}
                value={selectedValue}
                itemToStringLabel={(itemValue) => items.find((item) => item.id === itemValue)?.label ?? String(itemValue)}
                defaultValue={defaultValue}
                disabled={isDisabled}
                required={isRequired}
                onValueChange={(nextValue) => {
                    onSelectionChange?.(nextValue);
                    onValueChange?.(nextValue);
                }}
            >
                <div className={cx("flex min-w-0 flex-col gap-2", className)}>
                    {label && (
                        <Label htmlFor={inputId} isRequired={isRequired} isInvalid={isInvalid} tooltip={tooltip}>
                            {label}
                        </Label>
                    )}
                    <BaseCombobox.InputGroup
                        className={cx(
                            "shadow-xs relative flex w-full items-center gap-2 rounded-md bg-surface-1 ring-1 ring-strong outline-hidden transition-shadow duration-100 ease-linear ring-inset",
                            "focus-within:ring-2 focus-within:ring-accent-strong",
                            "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
                            sizes[size].root,
                        )}
                        aria-invalid={isInvalid || undefined}
                    >
                        {IconComponent ? <IconComponent data-icon aria-hidden="true" /> : (iconNode ?? <Search data-icon aria-hidden="true" />)}
                        <BaseCombobox.Input
                            id={inputId}
                            aria-label={label}
                            placeholder={placeholder}
                            className={cx("min-w-0 flex-1 bg-transparent text-primary outline-none placeholder:text-placeholder", sizes[size].text)}
                        />
                        {shortcut && (
                            <span className={cx("hidden rounded px-1 py-px text-xs text-placeholder ring-1 ring-subtle md:inline-flex", shortcutClassName)}>
                                ⌘K
                            </span>
                        )}
                        <BaseCombobox.Trigger aria-label="Open options" className="shrink-0 text-placeholder">
                            <ChevronDown className="size-4" aria-hidden="true" />
                        </BaseCombobox.Trigger>
                    </BaseCombobox.InputGroup>
                    <BaseCombobox.Portal>
                        <BaseCombobox.Positioner className="z-50 outline-none" sideOffset={4}>
                            <BaseCombobox.Popup
                                className={cx(
                                    "shadow-lg min-w-(--anchor-width) overflow-hidden rounded-md bg-surface-1 p-1 ring-1 ring-secondary_alt outline-none",
                                    popoverClassName,
                                )}
                            >
                                <BaseCombobox.List className="max-h-72 overflow-y-auto outline-none">{renderedItems}</BaseCombobox.List>
                                <BaseCombobox.Empty className="px-3 py-4 text-center text-sm text-tertiary">No results found.</BaseCombobox.Empty>
                            </BaseCombobox.Popup>
                        </BaseCombobox.Positioner>
                    </BaseCombobox.Portal>
                    {hint && <HintText isInvalid={isInvalid}>{hint}</HintText>}
                </div>
            </BaseCombobox.Root>
        </SelectContext.Provider>
    );
};

export const ComboBoxItem = ({ item, children }: { item: SelectItemType; children?: ReactNode }) => {
    const { size } = useContext(SelectContext);
    const Icon = item.icon;
    return (
        <BaseCombobox.Item
            value={item.id}
            disabled={item.isDisabled}
            className={(state) => cx("w-full rounded-md outline-none data-[highlighted]:bg-layer-1-hover", state.highlighted && "bg-layer-1-hover")}
        >
            <div className={cx("flex cursor-pointer items-center", sizes[size].root)}>
                {item.avatarUrl && <Avatar size="xs" src={item.avatarUrl} alt={item.label} />}
                {isReactComponent(Icon) &&
                    (() => {
                        const IconComponent = Icon as FC;
                        return <IconComponent data-icon aria-hidden="true" />;
                    })()}
                <span className={cx("min-w-0 flex-1 truncate font-medium text-primary", sizes[size].text)}>{children ?? item.label}</span>
            </div>
        </BaseCombobox.Item>
    );
};
