/**
 * Calcula a `position` (esquema de gaps de 1000) pro item entrar no índice `index` de `siblings`,
 * que já vem em ordem visual e sem o próprio item. Serve pra cards e colunas, que compartilham o
 * mesmo esquema de ordenação por `position` real.
 */
export function positionAtIndex(siblings: { position: number }[], index: number): number {
    const before = siblings[index - 1];
    const after = siblings[index];
    if (!before && !after) return 1000;
    if (!before) return after.position / 2;
    if (!after) return before.position + 1000;
    return (before.position + after.position) / 2;
}
