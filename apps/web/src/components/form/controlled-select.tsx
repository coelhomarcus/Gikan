import type { FC, ReactNode } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Select } from "@/components/base/select/select";
import type { SelectItemType } from "@/components/base/select/select-shared";
import { useTranslation } from "react-i18next";
import { translateValidationMessage } from "@/i18n/validation";

interface ControlledSelectProps<TFieldValues extends FieldValues> {
    control: Control<TFieldValues>;
    name: FieldPath<TFieldValues>;
    items: SelectItemType[];
    label?: string;
    placeholder?: string;
    isRequired?: boolean;
    size?: "sm" | "md" | "lg";
    /** Fixed field icon, shown when the selected item has no `icon` of its own. */
    icon?: FC | ReactNode;
    /**
     * For optional fields (nullable relation, e.g. assigneeId/categoryId). React Aria's Select
     * has no native "clear selection" option, so the UI uses a sentinel item — translation to
     * and from `null` happens here, before the value reaches the Zod schema (which validates
     * `.uuid()` and would reject the sentinel string as an invalid UUID).
     */
    nullOption?: { id: string; label: string; icon?: FC | ReactNode };
}

export function ControlledSelect<TFieldValues extends FieldValues>({
    control,
    name,
    items,
    label,
    placeholder,
    isRequired,
    size,
    icon,
    nullOption,
}: ControlledSelectProps<TFieldValues>) {
    const { t } = useTranslation();
    const allItems = nullOption ? [nullOption, ...items] : items;

    return (
        <Controller
            control={control}
            name={name}
            render={({ field, fieldState }) => (
                <Select
                    selectedKey={(field.value as string | null | undefined) ?? (nullOption ? nullOption.id : null)}
                    onSelectionChange={(key) => field.onChange(nullOption && key === nullOption.id ? null : key)}
                    items={allItems}
                    label={label}
                    placeholder={placeholder}
                    isRequired={isRequired}
                    size={size}
                    icon={icon}
                    isInvalid={!!fieldState.error}
                    hint={translateValidationMessage(fieldState.error?.message, t)}
                >
                    {(item) => (
                        <Select.Item id={item.id} supportingText={item.supportingText} avatarUrl={item.avatarUrl} icon={item.icon}>
                            {item.label}
                        </Select.Item>
                    )}
                </Select>
            )}
        />
    );
}
