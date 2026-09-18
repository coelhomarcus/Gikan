import type { CSSProperties } from "react";

/** Presets offered by the selector. The same hex values as the category palette are redefined here to avoid coupling board ↔ categories. */
export const COLUMN_COLORS = ["#f04438", "#f79009", "#eaaa08", "#17b26a", "#15b79e", "#2e90fa", "#0070f3", "#7a5af8"];

/** Color shown in the header dot when the column has no defined color (the same gray used as the `CategoryBadge` fallback). */
export const COLUMN_FALLBACK_COLOR = "#87888c";

/**
 * Tints the card with the column color.
 *
 * The card sits on `bg-primary`, which is pure white in the light theme and nearly black in the
 * dark theme — painting the hex directly would harm readability in one of them. Mixing with the
 * surface solves this: because `--color-bg-primary` already changes between themes, the same
 * expression produces a dark tone in the dark theme and a pastel in the light theme without
 * detecting the theme in JS. Text continues to use the usual semantic tokens and remains legible.
 *
 * Without a defined color, returns `undefined` and the card keeps its previous neutral appearance.
 */
export function columnTint(color: string | null | undefined): CSSProperties | undefined {
    if (!color) return undefined;

    return {
        backgroundColor: `color-mix(in srgb, ${color} 14%, var(--color-bg-primary))`,
        borderColor: `color-mix(in srgb, ${color} 45%, var(--color-bg-primary))`,
    };
}
