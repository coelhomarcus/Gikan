import type { CSSProperties } from "react";

/** Presets oferecidos no seletor. Mesmos hexes da paleta de categorias, redefinidos aqui pra não acoplar board ↔ categorias. */
export const COLUMN_COLORS = ["#f04438", "#f79009", "#eaaa08", "#17b26a", "#15b79e", "#2e90fa", "#0070f3", "#7a5af8"];

/** Cor mostrada no ponto do cabeçalho quando a coluna não tem cor definida (mesmo cinza que o `CategoryBadge` usa como fallback). */
export const COLUMN_FALLBACK_COLOR = "#87888c";

/**
 * Tingimento do card na cor da coluna.
 *
 * O card fica sobre `bg-primary`, que é branco puro no tema claro e quase-preto no escuro — pintar
 * o hex direto quebraria a legibilidade num dos dois. Misturar com a própria superfície resolve:
 * como `--color-bg-primary` já troca de valor entre os temas, a mesma expressão rende um tom
 * escuro no tema escuro e um pastel no claro, sem precisar detectar o tema em JS. O texto continua
 * nos tokens semânticos de sempre, então segue legível com qualquer cor escolhida.
 *
 * Sem cor definida devolve `undefined`, e o card mantém exatamente a aparência neutra de antes.
 */
export function columnTint(color: string | null | undefined): CSSProperties | undefined {
    if (!color) return undefined;

    return {
        backgroundColor: `color-mix(in srgb, ${color} 14%, var(--color-bg-primary))`,
        borderColor: `color-mix(in srgb, ${color} 45%, var(--color-bg-primary))`,
    };
}
