import type { EntityIcon } from "@gikan/shared";
import { useEffect, useState } from "react";
import { ImagePlus, Smile, Sparkles, X } from "lucide-react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { ProjectIconPicker } from "@/features/projects/components/project-icon-picker";
import { ProjectIcon } from "@/features/projects/components/project-icon";
import { useTranslation } from "react-i18next";

const EMOJIS = ["😀", "🚀", "✨", "🔥", "🎯", "📚", "🛠️", "💡", "✅", "🧠", "🎨", "🌱", "📌", "📈", "🧩", "🌍", "⚡", "🛰️", "📝", "💬", "🏗️", "🔒", "🧪", "🎉"];
type Tab = "icons" | "emoji" | "image";

interface AppearancePickerProps {
    value: EntityIcon | null | undefined;
    onChange: (appearance: EntityIcon | null) => void;
    onComplete?: () => void;
}

export function AppearancePicker({ value, onChange, onComplete }: AppearancePickerProps) {
    const { t } = useTranslation();
    const [tab, setTab] = useState<Tab>(value?.type === "emoji" ? "emoji" : value?.type === "image" ? "image" : "icons");
    const [emoji, setEmoji] = useState(value?.type === "emoji" ? value.value : "");
    const [url, setUrl] = useState(value?.type === "image" ? value.url : "");
    const [imageError, setImageError] = useState("");
    useEffect(() => {
        if (value?.type === "emoji") setEmoji(value.value);
        if (value?.type === "image") setUrl(value.url);
    }, [value]);
    const select = (next: EntityIcon | null) => {
        onChange(next);
        onComplete?.();
    };
    const useImage = () => {
        try {
            const parsed = new URL(url.trim());
            if (!/^https?:$/.test(parsed.protocol) || parsed.username || parsed.password) throw new Error();
            setImageError("");
            select({ type: "image", url: parsed.toString() });
        } catch {
            setImageError(t("appearance.httpImageUrl"));
        }
    };
    return (
        <div className="w-80 max-w-[calc(100vw-3rem)]">
            <div className="mb-3 flex items-center gap-1 border-b border-subtle pb-2" role="tablist" aria-label={t("appearance.appearanceType")}>
                {[
                    ["icons", Sparkles, t("appearance.icons")],
                    ["emoji", Smile, t("appearance.emoji")],
                    ["image", ImagePlus, t("appearance.image")],
                ].map(([id, Icon, label]) => (
                    <button key={id as string} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id as Tab)} className={`flex h-7 items-center gap-1 rounded px-2 text-xs font-medium ${tab === id ? "bg-layer-1 text-primary" : "text-tertiary hover:bg-layer-1-hover hover:text-secondary"}`}>
                        <Icon className="size-3.5" /> {label as string}
                    </button>
                ))}
                {value && <button type="button" className="ml-auto flex size-7 items-center justify-center rounded text-tertiary hover:bg-layer-1-hover hover:text-danger-primary" onClick={() => select(null)} aria-label={t("appearance.removeIcon")}><X className="size-3.5" /></button>}
            </div>
            {tab === "icons" && <ProjectIconPicker value={value?.type === "icon" ? value.key : null} onChange={(key) => select({ type: "icon", key })} />}
            {tab === "emoji" && (
                <div className="space-y-3">
                    <Input label={t("appearance.emojiLabel")} value={emoji} onChange={setEmoji} placeholder={t("appearance.pasteEmoji")} />
                    <div className="grid grid-cols-8 gap-1" aria-label={t("appearance.emojiLabel")}>
                        {EMOJIS.map((item) => <button key={item} type="button" className="flex size-8 items-center justify-center rounded text-lg hover:bg-layer-1-hover focus-visible:outline-2 focus-visible:outline-accent-strong" onClick={() => { setEmoji(item); select({ type: "emoji", value: item }); }}>{item}</button>)}
                    </div>
                    <Button size="sm" isDisabled={!emoji.trim()} onClick={() => select({ type: "emoji", value: emoji.trim() })}>{t("appearance.useEmoji")}</Button>
                </div>
            )}
            {tab === "image" && (
                <div className="space-y-3">
                    <Input label={t("appearance.imageUrl")} value={url} onChange={(next) => { setUrl(next); setImageError(""); }} placeholder="https://..." isInvalid={!!imageError} hint={imageError || t("appearance.directImage")} />
                    {url && <div className="flex h-20 items-center justify-center rounded-md border border-subtle bg-surface-2"><img src={url} alt="" referrerPolicy="no-referrer" className="max-h-full max-w-full object-contain p-2" onError={() => setImageError(t("appearance.imageLoadFailed"))} /></div>}
                    <Button size="sm" onClick={useImage}>{t("appearance.useImage")}</Button>
                </div>
            )}
        </div>
    );
}

export function AppearancePreview({ value, className }: { value: EntityIcon | null | undefined; className?: string }) {
    return <ProjectIcon icon={value ?? null} className={className} />;
}
