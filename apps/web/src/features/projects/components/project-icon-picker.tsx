import { useMemo, useState } from "react";
import type { ProjectIconKey } from "@gikan/shared";
import { projectIconKeys } from "@gikan/shared";
import { Search } from "lucide-react";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import { DEFAULT_PROJECT_ICON, resolveProjectIcon } from "./project-icon";

interface ProjectIconPickerProps {
    value: string | null | undefined;
    onChange: (icon: string) => void;
    label?: string;
}

const iconLabels: Record<ProjectIconKey, string> = Object.fromEntries(
    projectIconKeys.map((key) => [key, key.replaceAll("-", " ")]),
) as Record<ProjectIconKey, string>;

const iconGroups: Array<{ label: string; keys: ProjectIconKey[] }> = [
    {
        label: "Popular",
        keys: ["cube", "rocket", "code", "browser", "briefcase", "book", "chart", "target", "star", "sparkles"],
    },
    {
        label: "Technology",
        keys: ["server", "database", "mobile", "desktop", "cpu", "bot", "blocks", "cloud", "terminal", "workflow", "gauge"],
    },
    {
        label: "Objects",
        keys: ["archive", "award", "calendar", "diamond", "gift", "headphones", "house", "map", "message", "music", "plane", "puzzle", "shield", "store", "tag", "telescope", "ticket", "video", "wallet"],
    },
    {
        label: "Nature and people",
        keys: ["activity", "atom", "building", "compass", "fingerprint", "flask", "folder", "gamepad", "globe", "heart", "leaf", "lightbulb", "lock", "palette", "pen", "thumbs-up", "users", "tool", "flag", "package", "cart", "zap", "layers"],
    },
];

/** Searchable icon catalog that keeps persisted semantic keys independent from Lucide names. */
export const ProjectIconPicker = ({ value, onChange, label = "Icon" }: ProjectIconPickerProps) => {
    const selected = value ?? DEFAULT_PROJECT_ICON;
    const [query, setQuery] = useState("");
    const normalizedQuery = query.trim().toLowerCase();
    const filteredGroups = useMemo(
        () =>
            iconGroups
                .map((group) => ({
                    ...group,
                    keys: group.keys.filter((key) => !normalizedQuery || iconLabels[key].includes(normalizedQuery) || key.includes(normalizedQuery)),
                }))
                .filter((group) => group.keys.length > 0),
        [normalizedQuery],
    );

    return (
        <div className="flex min-w-0 flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-secondary">{label}</p>
                <span className="text-xs text-tertiary">{projectIconKeys.length} icons</span>
            </div>

            <Input
                aria-label="Search project icons"
                placeholder="Search icons"
                value={query}
                onChange={setQuery}
                icon={Search}
                size="sm"
            />

            <div className="max-h-64 space-y-4 overflow-y-auto pr-1">
                {filteredGroups.length === 0 && <p className="py-3 text-center text-sm text-tertiary">No icons found.</p>}
                {filteredGroups.map((group) => (
                    <section key={group.label} aria-label={group.label}>
                        <p className="mb-2 text-xs font-medium text-tertiary">{group.label}</p>
                        <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
                            {group.keys.map((key) => {
                                const Icon = resolveProjectIcon(key);
                                const isSelected = selected === key;

                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        aria-label={`Use ${iconLabels[key]} icon`}
                                        aria-pressed={isSelected}
                                        title={iconLabels[key]}
                                        tabIndex={isSelected || (!filteredGroups.some((item) => item.keys.includes(selected as ProjectIconKey)) && group.keys[0] === key) ? 0 : -1}
                                        onClick={() => onChange(key)}
                                        onKeyDown={(event) => {
                                            if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
                                            event.preventDefault();
                                            const buttons = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button") ?? []);
                                            const index = buttons.indexOf(event.currentTarget);
                                            const columns = Math.max(1, getComputedStyle(event.currentTarget.parentElement!).gridTemplateColumns.split(" ").length);
                                            const offset = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" ? -columns : event.key === "ArrowDown" ? columns : event.key === "Home" ? -index : buttons.length - index - 1;
                                            buttons[Math.max(0, Math.min(buttons.length - 1, index + offset))]?.focus();
                                        }}
                                        className={cx(
                                            "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-fg-secondary ring-1 ring-secondary transition duration-100 ease-linear ring-inset hover:bg-primary_hover hover:text-fg-primary focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                                            isSelected && "bg-brand-primary_alt text-fg-brand-primary ring-2 ring-brand hover:text-fg-brand-primary",
                                        )}
                                    >
                                        <Icon className="size-4.5" aria-hidden="true" />
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
};
