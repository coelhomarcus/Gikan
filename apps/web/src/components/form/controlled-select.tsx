import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Select } from "@/components/base/select/select";
import type { SelectItemType } from "@/components/base/select/select-shared";

interface ControlledSelectProps<TFieldValues extends FieldValues> {
    control: Control<TFieldValues>;
    name: FieldPath<TFieldValues>;
    items: SelectItemType[];
    label?: string;
    placeholder?: string;
    isRequired?: boolean;
    size?: "sm" | "md" | "lg";
}

export function ControlledSelect<TFieldValues extends FieldValues>({
    control,
    name,
    items,
    label,
    placeholder,
    isRequired,
    size,
}: ControlledSelectProps<TFieldValues>) {
    return (
        <Controller
            control={control}
            name={name}
            render={({ field, fieldState }) => (
                <Select
                    selectedKey={(field.value as string | null | undefined) ?? null}
                    onSelectionChange={(key) => field.onChange(key)}
                    items={items}
                    label={label}
                    placeholder={placeholder}
                    isRequired={isRequired}
                    size={size}
                    isInvalid={!!fieldState.error}
                    hint={fieldState.error?.message}
                >
                    {(item) => (
                        <Select.Item id={item.id} supportingText={item.supportingText}>
                            {item.label}
                        </Select.Item>
                    )}
                </Select>
            )}
        />
    );
}
