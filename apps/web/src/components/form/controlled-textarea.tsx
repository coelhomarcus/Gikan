import type { ComponentProps } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { Controller } from "react-hook-form";
import { TextArea } from "@/components/base/textarea/textarea";

type TextAreaProps = ComponentProps<typeof TextArea>;

interface ControlledTextareaProps<TFieldValues extends FieldValues> extends Omit<TextAreaProps, "value" | "onChange" | "onBlur" | "name" | "isInvalid"> {
    control: Control<TFieldValues>;
    name: FieldPath<TFieldValues>;
}

export function ControlledTextarea<TFieldValues extends FieldValues>({ control, name, ...textareaProps }: ControlledTextareaProps<TFieldValues>) {
    return (
        <Controller
            control={control}
            name={name}
            render={({ field, fieldState }) => (
                <TextArea
                    {...textareaProps}
                    name={field.name}
                    value={(field.value as string | undefined) ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    textAreaRef={field.ref}
                    isInvalid={!!fieldState.error}
                    hint={fieldState.error?.message ?? textareaProps.hint}
                />
            )}
        />
    );
}
