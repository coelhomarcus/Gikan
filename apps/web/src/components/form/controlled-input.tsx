import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Input, type InputProps } from "@/components/base/input/input";
import { useTranslation } from "react-i18next";
import { translateValidationMessage } from "@/i18n/validation";

interface ControlledInputProps<TFieldValues extends FieldValues, TTransformedValues extends FieldValues = TFieldValues> extends Omit<InputProps, "value" | "onChange" | "onBlur" | "name" | "isInvalid"> {
    control: Control<TFieldValues, any, TTransformedValues>;
    name: FieldPath<TFieldValues>;
}

export function ControlledInput<TFieldValues extends FieldValues, TTransformedValues extends FieldValues = TFieldValues>({ control, name, ...inputProps }: ControlledInputProps<TFieldValues, TTransformedValues>) {
    const { t } = useTranslation();
    return (
        <Controller<TFieldValues, FieldPath<TFieldValues>, TTransformedValues>
            control={control}
            name={name}
            render={({ field, fieldState }) => (
                <Input
                    {...inputProps}
                    name={field.name}
                    value={(field.value as string | undefined) ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    ref={field.ref}
                    isInvalid={!!fieldState.error}
                    hint={translateValidationMessage(fieldState.error?.message, t) ?? inputProps.hint}
                />
            )}
        />
    );
}
