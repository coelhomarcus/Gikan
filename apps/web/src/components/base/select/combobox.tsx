import type { FC, ReactNode, RefAttributes } from "react";
import { useContext } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
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
    const renderedItems = typeof children === "function" ? items.map((item) => children(item)) : children;
    const IconComponent = isReactComponent(icon) ? (icon as FC) : null;
    const iconNode = IconComponent ? null : (icon as ReactNode | undefined);

    return (
        <SelectContext.Provider value={{ size }}>
            <BaseCombobox.Root
                items={items.map((item) => ({ value: item.id, label: item.label ?? String(item.id) }))}
                value={selectedValue}
                defaultValue={defaultValue}
                disabled={isDisabled}
                required={isRequired}
                onValueChange={(nextValue) => {
                    onSelectionChange?.(nextValue);
                    onValueChange?.(nextValue);
                }}
            >
                <div className={cx("flex min-w-0 flex-col gap-1.5", className)}>
                    {label && <Label isRequired={isRequired} isInvalid={isInvalid} tooltip={tooltip}>{label}</Label>}
                    <BaseCombobox.InputGroup
                    className={cx(
                        "relative flex w-full items-center gap-2 rounded-lg bg-primary shadow-xs ring-1 ring-primary outline-hidden transition-shadow duration-100 ease-linear ring-inset",
                        "focus-within:ring-2 focus-within:ring-brand",
                        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
                        sizes[size].root,
                    )}
                    aria-invalid={isInvalid || undefined}
                    >
                        {IconComponent ? <IconComponent data-icon aria-hidden="true" /> : iconNode ?? <Search data-icon aria-hidden="true" />}
                        <BaseCombobox.Input placeholder={placeholder} className={cx("min-w-0 flex-1 bg-transparent text-primary outline-none placeholder:text-placeholder", sizes[size].text)} />
                        {shortcut && <span className={cx("hidden rounded px-1 py-px text-xs text-quaternary ring-1 ring-secondary md:inline-flex", shortcutClassName)}>⌘K</span>}
                        <BaseCombobox.Trigger aria-label="Open options" className="shrink-0 text-fg-quaternary">
                            <ChevronDown className="size-4" aria-hidden="true" />
                        </BaseCombobox.Trigger>
                    </BaseCombobox.InputGroup>
                    <BaseCombobox.Portal>
                    <BaseCombobox.Positioner className="z-50 outline-none" sideOffset={4}>
                        <BaseCombobox.Popup className={cx("min-w-(--anchor-width) overflow-hidden rounded-lg bg-primary p-1 shadow-lg ring-1 ring-secondary_alt outline-none", popoverClassName)}>
                            <BaseCombobox.List className="max-h-72 overflow-y-auto outline-none">{renderedItems}</BaseCombobox.List>
                            <BaseCombobox.Empty className="px-3 py-6 text-center text-sm text-tertiary">No results found.</BaseCombobox.Empty>
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
        <BaseCombobox.Item value={item.id} disabled={item.isDisabled} className={(state) => cx("w-full rounded-md outline-none data-[highlighted]:bg-primary_hover", state.highlighted && "bg-primary_hover")}>
            <div className={cx("flex cursor-pointer items-center", sizes[size].root)}>
                {item.avatarUrl && <Avatar size="xs" src={item.avatarUrl} alt={item.label} />}
                {isReactComponent(Icon) && (() => { const IconComponent = Icon as FC; return <IconComponent data-icon aria-hidden="true" />; })()}
                <span className={cx("min-w-0 flex-1 truncate font-medium text-primary", sizes[size].text)}>{children ?? item.label}</span>
            </div>
        </BaseCombobox.Item>
    );
};
