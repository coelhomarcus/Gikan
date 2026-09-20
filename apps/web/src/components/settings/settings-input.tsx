import { type InputHTMLAttributes, type Ref, useId } from "react";
import { Field } from "@makeplane/propel/components/field";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { TextArea, TextAreaGroup } from "@makeplane/propel/components/text-area";
import { type Control, Controller, type FieldPath, type FieldValues } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { translateValidationMessage } from "@/i18n/validation";

interface SettingsInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "onChange" | "value" | "className" | "style"> {
    label: string;
    value?: string;
    onChange?: (value: string) => void;
    hint?: string;
    isRequired?: boolean;
    isDisabled?: boolean;
    isInvalid?: boolean;
    ref?: Ref<HTMLInputElement>;
}

/** The same Propel 2xl controls used by Plane's project and account forms. */
export function SettingsInput({ label, hint, isRequired, isDisabled, isInvalid, onChange, id, ...props }: SettingsInputProps) {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
        <div className="flex min-w-0 flex-col gap-1">
            <label htmlFor={inputId} className="text-sm text-primary">
                {label}
            </label>
            <Field name={props.name} disabled={isDisabled} invalid={isInvalid}>
                <InputGroup size="2xl">
                    <Input
                        {...props}
                        id={inputId}
                        size="2xl"
                        disabled={isDisabled}
                        required={isRequired}
                        aria-describedby={hint ? `${inputId}-hint` : undefined}
                        onChange={(event) => onChange?.(event.currentTarget.value)}
                    />
                </InputGroup>
            </Field>
            {hint && (
                <p id={`${inputId}-hint`} className={`text-xs ${isInvalid ? "text-danger-primary" : "text-tertiary"}`}>
                    {hint}
                </p>
            )}
        </div>
    );
}

interface ControlledSettingsInputProps<T extends FieldValues> extends Omit<SettingsInputProps, "name" | "value" | "onChange" | "onBlur" | "isInvalid"> {
    control: Control<T>;
    name: FieldPath<T>;
}

export function ControlledSettingsInput<T extends FieldValues>({ control, name, ...props }: ControlledSettingsInputProps<T>) {
    const { t } = useTranslation();
    return (
        <Controller
            control={control}
            name={name}
            render={({ field, fieldState }) => (
                <SettingsInput {...props} {...field} value={field.value ?? ""} isInvalid={!!fieldState.error} hint={translateValidationMessage(fieldState.error?.message, t) ?? props.hint} />
            )}
        />
    );
}

export function ControlledSettingsDescription<T extends FieldValues>({
    control,
    name,
    isDisabled,
}: {
    control: Control<T>;
    name: FieldPath<T>;
    isDisabled?: boolean;
}) {
    const id = useId();
    const { t } = useTranslation();
    return (
        <Controller
            control={control}
            name={name}
            render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1">
                    <label htmlFor={id} className="text-sm text-primary">
                        {t("projects.description")}
                    </label>
                    <Field name={name} disabled={isDisabled} invalid={!!fieldState.error}>
                        <TextAreaGroup resize="none">
                            <TextArea
                                {...field}
                                id={id}
                                value={field.value ?? ""}
                                size="lg"
                                surface="field"
                                autoResize
                                maxRows={8}
                                disabled={isDisabled}
                                placeholder={t("projects.describeProject")}
                                aria-describedby={fieldState.error ? `${id}-error` : undefined}
                            />
                        </TextAreaGroup>
                    </Field>
                    {fieldState.error && (
                        <p id={`${id}-error`} className="text-xs text-danger-primary">
                            {translateValidationMessage(fieldState.error.message, t)}
                        </p>
                    )}
                </div>
            )}
        />
    );
}
