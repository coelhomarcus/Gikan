import { useMemo, useState } from "react";
import type { ProjectIconKey } from "@gikan/shared";
import { projectIconKeys } from "@gikan/shared";
import { Search } from "lucide-react";
import { Input } from "@/components/base/input/input";
import { cx } from "@/utils/cx";
import { DEFAULT_PROJECT_ICON, resolveProjectIcon } from "./project-icon";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/i18n/language-provider";

interface ProjectIconPickerProps {
    value: string | null | undefined;
    onChange: (icon: string) => void;
    label?: string;
}

const iconLabels: Record<ProjectIconKey, { en: string; pt: string }> = {
    cube: { en: "Cube", pt: "Cubo" }, rocket: { en: "Rocket", pt: "Foguete" }, code: { en: "Code", pt: "Código" }, browser: { en: "Browser", pt: "Navegador" },
    briefcase: { en: "Briefcase", pt: "Pasta executiva" }, book: { en: "Book", pt: "Livro" }, chart: { en: "Chart", pt: "Gráfico" }, target: { en: "Target", pt: "Alvo" },
    lightbulb: { en: "Lightbulb", pt: "Lâmpada" }, flag: { en: "Flag", pt: "Bandeira" }, star: { en: "Star", pt: "Estrela" }, heart: { en: "Heart", pt: "Coração" },
    globe: { en: "Globe", pt: "Globo" }, server: { en: "Server", pt: "Servidor" }, database: { en: "Database", pt: "Banco de dados" }, mobile: { en: "Mobile", pt: "Celular" },
    desktop: { en: "Desktop", pt: "Computador" }, cart: { en: "Cart", pt: "Carrinho" }, zap: { en: "Lightning", pt: "Raio" }, package: { en: "Package", pt: "Pacote" },
    palette: { en: "Palette", pt: "Paleta" }, pen: { en: "Pen", pt: "Caneta" }, users: { en: "Users", pt: "Pessoas" }, tool: { en: "Tool", pt: "Ferramenta" },
    activity: { en: "Activity", pt: "Atividade" }, archive: { en: "Archive", pt: "Arquivo" }, atom: { en: "Atom", pt: "Átomo" }, award: { en: "Award", pt: "Prêmio" },
    blocks: { en: "Blocks", pt: "Blocos" }, bot: { en: "Bot", pt: "Robô" }, building: { en: "Building", pt: "Edifício" }, calendar: { en: "Calendar", pt: "Calendário" },
    cloud: { en: "Cloud", pt: "Nuvem" }, compass: { en: "Compass", pt: "Bússola" }, cpu: { en: "CPU", pt: "Processador" }, diamond: { en: "Diamond", pt: "Diamante" },
    fingerprint: { en: "Fingerprint", pt: "Impressão digital" }, flask: { en: "Flask", pt: "Frasco" }, folder: { en: "Folder", pt: "Pasta" }, gamepad: { en: "Gamepad", pt: "Controle" },
    gauge: { en: "Gauge", pt: "Medidor" }, gift: { en: "Gift", pt: "Presente" }, headphones: { en: "Headphones", pt: "Fones de ouvido" }, house: { en: "House", pt: "Casa" },
    layers: { en: "Layers", pt: "Camadas" }, leaf: { en: "Leaf", pt: "Folha" }, lock: { en: "Lock", pt: "Cadeado" }, map: { en: "Map", pt: "Mapa" },
    message: { en: "Message", pt: "Mensagem" }, music: { en: "Music", pt: "Música" }, plane: { en: "Plane", pt: "Avião" }, puzzle: { en: "Puzzle", pt: "Quebra-cabeça" },
    shield: { en: "Shield", pt: "Escudo" }, sparkles: { en: "Sparkles", pt: "Brilhos" }, store: { en: "Store", pt: "Loja" }, tag: { en: "Tag", pt: "Etiqueta" },
    terminal: { en: "Terminal", pt: "Terminal" }, telescope: { en: "Telescope", pt: "Telescópio" }, "thumbs-up": { en: "Thumbs up", pt: "Polegar para cima" }, ticket: { en: "Ticket", pt: "Ingresso" },
    video: { en: "Video", pt: "Vídeo" }, wallet: { en: "Wallet", pt: "Carteira" }, workflow: { en: "Workflow", pt: "Fluxo de trabalho" },
};

const iconGroups: Array<{ id: string; keys: ProjectIconKey[] }> = [
    {
        id: "popular",
        keys: ["cube", "rocket", "code", "browser", "briefcase", "book", "chart", "target", "star", "sparkles"],
    },
    {
        id: "technology",
        keys: ["server", "database", "mobile", "desktop", "cpu", "bot", "blocks", "cloud", "terminal", "workflow", "gauge"],
    },
    {
        id: "objects",
        keys: ["archive", "award", "calendar", "diamond", "gift", "headphones", "house", "map", "message", "music", "plane", "puzzle", "shield", "store", "tag", "telescope", "ticket", "video", "wallet"],
    },
    {
        id: "naturePeople",
        keys: ["activity", "atom", "building", "compass", "fingerprint", "flask", "folder", "gamepad", "globe", "heart", "leaf", "lightbulb", "lock", "palette", "pen", "thumbs-up", "users", "tool", "flag", "package", "cart", "zap", "layers"],
    },
];

/** Searchable icon catalog that keeps persisted semantic keys independent from Lucide names. */
export const ProjectIconPicker = ({ value, onChange, label }: ProjectIconPickerProps) => {
    const { t } = useTranslation();
    const { locale } = useLanguage();
    const localizedIconLabel = (key: ProjectIconKey) => iconLabels[key][locale === "pt-BR" ? "pt" : "en"];
    const groupLabels: Record<string, string> = {
        popular: t("projectIcons.popular"),
        technology: t("projectIcons.technology"),
        objects: t("projectIcons.objects"),
        naturePeople: t("projectIcons.naturePeople"),
    };
    const selected = value ?? DEFAULT_PROJECT_ICON;
    const [query, setQuery] = useState("");
    const normalizedQuery = query.trim().toLowerCase();
    const filteredGroups = useMemo(
        () =>
            iconGroups
                .map((group) => ({
                    ...group,
                    keys: group.keys.filter((key) => {
                        const label = iconLabels[key][locale === "pt-BR" ? "pt" : "en"];
                        return !normalizedQuery || label.toLowerCase().includes(normalizedQuery) || iconLabels[key].en.toLowerCase().includes(normalizedQuery) || key.includes(normalizedQuery);
                    }),
                }))
                .filter((group) => group.keys.length > 0),
        [normalizedQuery, locale],
    );

    const allFilteredKeys = filteredGroups.flatMap((group) => group.keys);
    const selectedIsVisible = allFilteredKeys.includes(selected as ProjectIconKey);

    return (
        <div data-project-icon-picker className="flex min-h-0 min-w-0 flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-secondary">{label ?? t("projects.icon")}</p>
                <span className="text-xs text-tertiary">{t("projectIcons.iconCount", { count: projectIconKeys.length })}</span>
            </div>

            <Input
                aria-label={t("projectIcons.search")}
                placeholder={t("projectIcons.search")}
                value={query}
                onChange={setQuery}
                icon={Search}
                size="sm"
                autoFocus
            />

            <div className="max-h-[min(16rem,calc(100dvh-9rem))] min-w-0 space-y-3 overflow-x-hidden overflow-y-auto pr-1">
                {filteredGroups.length === 0 && <p className="py-3 text-center text-sm text-tertiary">{t("projectIcons.noResults")}</p>}
                {filteredGroups.map((group) => (
                    <section key={group.id} aria-label={groupLabels[group.id]}>
                        <p className="mb-1.5 text-xs font-medium text-tertiary">{groupLabels[group.id]}</p>
                        <div className="grid w-full min-w-0 grid-cols-7 gap-1 sm:grid-cols-8">
                            {group.keys.map((key) => {
                                const Icon = resolveProjectIcon(key);
                                const isSelected = selected === key;

                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        aria-label={t("projectIcons.useIcon", { icon: localizedIconLabel(key) })}
                                        aria-pressed={isSelected}
                                        title={localizedIconLabel(key)}
                                        tabIndex={isSelected || (!selectedIsVisible && allFilteredKeys[0] === key) ? 0 : -1}
                                        onClick={() => onChange(key)}
                                        onKeyDown={(event) => {
                                            if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
                                            event.preventDefault();
                                            const buttons = Array.from(event.currentTarget.closest("[data-project-icon-picker]")?.querySelectorAll<HTMLButtonElement>("button[data-project-icon-option]") ?? []);
                                            const index = buttons.indexOf(event.currentTarget);
                                            const columns = Math.max(1, getComputedStyle(event.currentTarget.parentElement!).gridTemplateColumns.split(" ").length);
                                            const offset = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : event.key === "ArrowUp" ? -columns : event.key === "ArrowDown" ? columns : event.key === "Home" ? -index : buttons.length - index - 1;
                                            buttons[Math.max(0, Math.min(buttons.length - 1, index + offset))]?.focus();
                                        }}
                                        data-project-icon-option
                                        className={cx(
                                            "flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-secondary ring-1 ring-subtle transition duration-100 ease-linear ring-inset hover:bg-layer-1-hover hover:text-primary focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong",
                                            isSelected && "bg-brand-primary_alt text-accent-primary ring-2 ring-accent-strong hover:text-accent-primary",
                                        )}
                                    >
                                        <Icon className="size-4" aria-hidden="true" />
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
