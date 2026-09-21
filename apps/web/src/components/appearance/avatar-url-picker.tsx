import { Popover } from "@base-ui/react/popover";
import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { useTranslation } from "react-i18next";

interface AvatarUrlPickerProps {
    value: string | null | undefined;
    initials: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

/** A profile-photo control that mirrors the cover picker: stage an URL, then apply it to the form. */
export function AvatarUrlPicker({ value, initials, onChange, disabled }: AvatarUrlPickerProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [url, setUrl] = useState(value ?? "");
    const [error, setError] = useState("");

    useEffect(() => {
        if (open) {
            setUrl(value ?? "");
            setError("");
        }
    }, [open, value]);

    const apply = () => {
        try {
            const parsed = new URL(url.trim());
            if (!/^https?:$/.test(parsed.protocol) || parsed.username || parsed.password) throw new Error();
            onChange(parsed.toString());
            setOpen(false);
        } catch {
            setError(t("appearance.httpImageUrl"));
        }
    };

    return (
        <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger
                disabled={disabled}
                aria-label={value ? t("profile.changePhoto") : t("profile.addPhoto")}
                className="absolute -right-2 -bottom-2 z-10 flex size-7 items-center justify-center rounded-md border border-strong bg-layer-2 text-secondary shadow-sm transition hover:bg-layer-2-hover disabled:opacity-50"
            >
                <Pencil className="size-3.5" />
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Positioner side="bottom" align="start" sideOffset={8} collisionPadding={12} className="z-[60]">
                    <Popover.Popup className="w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-subtle bg-layer-2 p-3 shadow-overlay-200 outline-none">
                        <Popover.Title className="mb-3 text-sm font-medium text-primary">{t("profile.profilePhoto")}</Popover.Title>
                        <div className="space-y-3">
                            <Input
                                label={t("profile.profilePhotoUrl")}
                                value={url}
                                onChange={(next) => {
                                    setUrl(next);
                                    setError("");
                                }}
                                placeholder="https://..."
                                isInvalid={!!error}
                                hint={error || t("appearance.directImage")}
                            />
                            <div className="flex h-20 items-center justify-center rounded-md border border-subtle bg-surface-2">
                                <Avatar key={url} src={url || undefined} initials={initials} size="xl" rounded={false} className="rounded-md" />
                            </div>
                            <div className="flex justify-between gap-2">
                                <Button color="tertiary-destructive" size="sm" isDisabled={!value} onClick={() => { onChange(""); setOpen(false); }}>
                                    {t("profile.removePhoto")}
                                </Button>
                                <Button size="sm" onClick={apply}>{t("appearance.apply")}</Button>
                            </div>
                        </div>
                    </Popover.Popup>
                </Popover.Positioner>
            </Popover.Portal>
        </Popover.Root>
    );
}
