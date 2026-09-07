import { cx } from "@/utils/cx";
import { COLUMN_COLORS, COLUMN_FALLBACK_COLOR } from "./column-color";

interface ColumnColorPickerProps {
    value: string | null | undefined;
    onChange: (color: string) => void;
    label?: string;
}

/**
 * Presets + cor livre. A grade segue o mesmo visual do seletor de cores das categorias; a cor livre
 * usa o `<input type="color">` nativo porque o kit do projeto não tem componente de color picker.
 */
export const ColumnColorPicker = ({ value, onChange, label = "Cor" }: ColumnColorPickerProps) => {
    const current = value ?? COLUMN_FALLBACK_COLOR;
    const isCustom = !!value && !COLUMN_COLORS.includes(value);

    return (
        <div className="flex flex-col gap-2">
            {label && <p className="text-sm font-medium text-secondary">{label}</p>}
            <div className="flex flex-wrap items-center gap-2">
                {COLUMN_COLORS.map((color) => (
                    <button
                        key={color}
                        type="button"
                        aria-label={`Cor ${color}`}
                        aria-pressed={current === color}
                        onClick={() => onChange(color)}
                        className={cx(
                            "size-6 shrink-0 cursor-pointer rounded-full outline-offset-2 transition duration-100 ease-linear",
                            current === color && "outline-2 outline-fg-primary",
                        )}
                        style={{ backgroundColor: color }}
                    />
                ))}

                <label
                    className={cx(
                        "relative flex size-6 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full outline-offset-2 transition duration-100 ease-linear",
                        isCustom ? "outline-2 outline-fg-primary" : "ring-1 ring-secondary ring-inset",
                    )}
                    style={isCustom ? { backgroundColor: current } : undefined}
                    title="Cor personalizada"
                >
                    {/* Gradiente só aparece quando nenhuma cor livre está ativa, sinalizando "escolher outra cor". */}
                    {!isCustom && (
                        <span
                            aria-hidden="true"
                            className="absolute inset-0"
                            style={{ background: "conic-gradient(#f04438, #f79009, #eaaa08, #17b26a, #2e90fa, #7a5af8, #f04438)" }}
                        />
                    )}
                    <input
                        type="color"
                        aria-label="Cor personalizada"
                        value={current}
                        onChange={(event) => onChange(event.target.value)}
                        className="absolute inset-0 cursor-pointer opacity-0"
                    />
                </label>
            </div>
        </div>
    );
};
