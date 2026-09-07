import type { FC, ReactNode } from "react";
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
    /** Ícone fixo do campo, mostrado quando o item selecionado não tem um `icon` próprio. */
    icon?: FC | ReactNode;
    /**
     * Pra campos opcionais (relação nullable, ex: assigneeId/categoryId). O Select do React
     * Aria não tem uma opção nativa de "limpar seleção", então usamos um item sentinela só
     * na UI — a tradução de/para `null` acontece bem aqui, antes do valor chegar no schema
     * Zod (que valida `.uuid()` e rejeitaria a string sentinela com "invalid uuid").
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
                    hint={fieldState.error?.message}
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
