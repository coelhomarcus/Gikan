import type { EntityCover } from "@gikan/shared";
import { Popover } from "@base-ui/react/popover";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Move, Trash2 } from "lucide-react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { CoverImage } from "./cover-image";
import { useTranslation } from "react-i18next";

interface CoverPickerProps {
    cover: EntityCover | null | undefined;
    onChange: (cover: EntityCover | null) => void;
    disabled?: boolean;
}

export function CoverPicker({ cover, onChange, disabled }: CoverPickerProps) {
    const { t } = useTranslation();
    const [open, setOpen] = useState(false);
    const [url, setUrl] = useState(cover?.url ?? "");
    const [position, setPosition] = useState(cover?.position ?? { x: 50, y: 50 });
    const [error, setError] = useState("");
    const preview = useRef<HTMLDivElement>(null);
    useEffect(() => { if (open) { setUrl(cover?.url ?? ""); setPosition(cover?.position ?? { x: 50, y: 50 }); setError(""); } }, [open, cover]);
    const apply = () => {
        try {
            const parsed = new URL(url.trim());
            if (!/^https?:$/.test(parsed.protocol) || parsed.username || parsed.password) throw new Error();
            onChange({ url: parsed.toString(), position });
            setOpen(false);
        } catch { setError(t("appearance.httpImageUrl")); }
    };
    const move = (event: React.PointerEvent<HTMLDivElement>) => {
        const target = preview.current;
        if (!target || !url) return;
        const rect = target.getBoundingClientRect();
        setPosition({ x: Math.round(Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100))), y: Math.round(Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100))) });
    };
    return (
        <Popover.Root open={open} onOpenChange={setOpen}>
            <Popover.Trigger disabled={disabled} className="inline-flex h-8 items-center gap-2 rounded px-2 text-xs font-medium text-tertiary hover:bg-layer-1-hover hover:text-secondary disabled:opacity-50">
                <ImagePlus className="size-3.5" /> {cover ? t("appearance.changeCover") : t("appearance.addCover")}
            </Popover.Trigger>
            <Popover.Portal><Popover.Positioner sideOffset={8} collisionPadding={12} className="z-[60]"><Popover.Popup className="w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-subtle bg-layer-2 p-3 shadow-overlay-200 outline-none">
                <Popover.Title className="sr-only">{t("appearance.cover")}</Popover.Title>
                <div className="space-y-3">
                    <Input label={t("appearance.coverImageUrl")} value={url} onChange={(value) => { setUrl(value); setError(""); }} placeholder="https://..." isInvalid={!!error} hint={error || t("appearance.dragCover")} />
                    <div
                        ref={preview}
                        data-cover-positioner
                        aria-label={t("appearance.dragCover")}
                        className="relative h-28 cursor-crosshair touch-none select-none overflow-hidden rounded border border-subtle"
                        onDragStart={(event) => event.preventDefault()}
                        onPointerDown={(event) => {
                            if (event.button !== 0) return;
                            // Prevent the browser from starting a native image drag. Pointer capture
                            // keeps the crop interaction active even when the cursor leaves the preview.
                            event.preventDefault();
                            event.currentTarget.setPointerCapture(event.pointerId);
                            move(event);
                        }}
                        onPointerMove={(event) => {
                            if (event.currentTarget.hasPointerCapture(event.pointerId)) move(event);
                        }}
                    >
                        <CoverImage cover={url ? { url, position } : null} className="size-full" />
                        {url && <span className="pointer-events-none absolute inset-0 grid place-items-center text-xs text-white drop-shadow"> <Move className="size-4" /> </span>}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-tertiary"><label>X <input className="ml-1 w-12 rounded border border-subtle bg-surface-1 px-1 py-0.5 text-primary" type="number" min="0" max="100" value={position.x} onChange={(event) => setPosition((current) => ({ ...current, x: Math.max(0, Math.min(100, Number(event.target.value) || 0)) }))} /></label><label>Y <input className="ml-1 w-12 rounded border border-subtle bg-surface-1 px-1 py-0.5 text-primary" type="number" min="0" max="100" value={position.y} onChange={(event) => setPosition((current) => ({ ...current, y: Math.max(0, Math.min(100, Number(event.target.value) || 0)) }))} /></label></div>
                    <div className="flex justify-between gap-2"><Button color="tertiary-destructive" size="sm" iconLeading={Trash2} isDisabled={!cover} onClick={() => { onChange(null); setOpen(false); }}>{t("appearance.removeCover")}</Button><Button size="sm" onClick={apply}>{t("appearance.apply")}</Button></div>
                </div>
            </Popover.Popup></Popover.Positioner></Popover.Portal>
        </Popover.Root>
    );
}
