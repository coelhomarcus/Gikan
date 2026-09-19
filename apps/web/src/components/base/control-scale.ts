/** Plane 01064a7: packages/propel/src/button/helper.tsx. Preserve Gikan's public size names. */
export const controlScale = {
    button: {
        xs: "h-5 px-1.5 text-xs", sm: "h-6 px-2 text-xs", md: "h-7 px-2 text-xs",
        lg: "h-8 px-2 text-sm", xl: "h-10 px-3 text-md",
    },
    iconButton: { xs: "size-5", sm: "size-6", md: "size-7", lg: "size-8", xl: "size-10" },
    field: { sm: "h-7 px-2 text-sm", md: "h-8 px-3 text-sm", lg: "h-10 px-3 text-md" },
} as const;
export const controlTokens = {
    control: "rounded-md", group: "gap-1", section: "gap-4", block: "gap-6", menu: "p-1", menuItem: "min-h-7 px-2 py-1",
} as const;
export type ControlSize = keyof typeof controlScale.button;
export type FieldSize = keyof typeof controlScale.field;
