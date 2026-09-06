import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Input, type InputProps } from "@/components/base/input/input";

interface ControlledInputProps<TFieldValues extends FieldValues> extends Omit<InputProps, "value" | "onChange" | "onBlur" | "name" | "isInvalid"> {
    control: Control<TFieldValues>;
    name: FieldPath<TFieldValues>;
}

export function ControlledInput<TFieldValues extends FieldValues>({ control, name, ...inputProps }: ControlledInputProps<TFieldValues>) {
    return (
        <Controller
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
                    hint={fieldState.error?.message ?? inputProps.hint}
                />
            )}
        />
    );
}
