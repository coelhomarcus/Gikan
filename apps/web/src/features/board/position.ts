/**
 * Calculates the `position` (1000-gap scheme) for an item to enter index `index` in `siblings`,
 * which is already in visual order and excludes the item itself. Cards and columns share this
 * same ordering scheme based on the actual `position` value.
 */
export function positionAtIndex(siblings: { position: number }[], index: number): number {
    const before = siblings[index - 1];
    const after = siblings[index];
    if (!before && !after) return 1000;
    if (!before) return after.position / 2;
    if (!after) return before.position + 1000;
    return (before.position + after.position) / 2;
}
