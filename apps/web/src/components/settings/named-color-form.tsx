import { useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { Alert } from "@/components/base/feedback/alert";
import { Input } from "@/components/base/input/input";
import { ApiError } from "@/lib/api-client";
import { SettingColorPicker } from "./setting-color-picker";

/** Inline editor used by the ordered workflow and the flat label list. */
export function NamedColorForm({
    initialName = "",
    initialColor,
    label,
    submitLabel,
    onSave,
    onClose,
}: {
    initialName?: string;
    initialColor: string | null;
    label: string;
    submitLabel: string;
    onSave: (input: { name: string; color: string | null }) => Promise<unknown>;
    onClose: () => void;
}) {
    const [name, setName] = useState(initialName);
    const [color, setColor] = useState(initialColor);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    return (
        <form
            className="space-y-3 rounded-sm border border-subtle bg-surface-1 px-3.5 py-3"
            onSubmit={async (event) => {
                event.preventDefault();
                if (pending) return;
                if (!name.trim()) {
                    setError(`Enter a ${label.toLowerCase()}.`);
                    return;
                }
                setPending(true);
                setError(null);
                try {
                    await onSave({ name: name.trim(), color });
                    onClose();
                } catch (reason) {
                    setError(reason instanceof ApiError ? reason.message : "Could not save. Try again.");
                } finally {
                    setPending(false);
                }
            }}
        >
            <div className="flex flex-wrap items-center gap-2">
                <SettingColorPicker value={color} onChange={setColor} isDisabled={pending} />
                <Input
                    aria-label={label}
                    placeholder={label}
                    value={name}
                    onChange={setName}
                    maxLength={60}
                    isDisabled={pending}
                    autoFocus
                    className="min-w-32 flex-1"
                />
                <Button type="submit" size="lg" isLoading={pending}>
                    {submitLabel}
                </Button>
                <Button color="secondary" size="lg" isDisabled={pending} onClick={onClose}>
                    Cancel
                </Button>
            </div>
            {error && <Alert tone="error">{error}</Alert>}
        </form>
    );
}
