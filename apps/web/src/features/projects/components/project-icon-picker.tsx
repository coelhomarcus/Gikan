import { projectIconKeys } from "@gikan/shared";
import { cx } from "@/utils/cx";
import { DEFAULT_PROJECT_ICON, resolveProjectIcon } from "./project-icon";

interface ProjectIconPickerProps {
    value: string | null | undefined;
    onChange: (icon: string) => void;
    label?: string;
}

/** Grade de ícones no mesmo padrão do seletor de cores das categorias (`categories-panel.tsx`). */
export const ProjectIconPicker = ({ value, onChange, label = "Ícone" }: ProjectIconPickerProps) => {
    const selected = value ?? DEFAULT_PROJECT_ICON;

    return (
        <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-secondary">{label}</p>
            <div className="flex flex-wrap gap-2">
                {projectIconKeys.map((key) => {
                    const Icon = resolveProjectIcon(key);
                    const isSelected = selected === key;

                    return (
                        <button
                            key={key}
                            type="button"
                            aria-label={`Ícone ${key}`}
                            aria-pressed={isSelected}
                            onClick={() => onChange(key)}
                            className={cx(
                                "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg ring-1 ring-secondary transition duration-100 ease-linear ring-inset hover:bg-primary_hover",
                                isSelected && "bg-brand-primary_alt text-fg-brand-primary ring-2 ring-brand",
                            )}
                        >
                            <Icon className="size-4.5" />
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
