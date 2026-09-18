/**
 * Shared sizing primitives for interactive controls.
 *
 * Keep these values deliberately boring: the whole application uses the same
 * 4px-based scale so controls remain aligned when they are composed together.
 */
export const controlScale = {
    button: {
        xs: "h-8 px-3 text-xs",
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-5 text-md",
        xl: "h-12 px-6 text-md",
    },
    iconButton: {
        xs: "size-7",
        sm: "size-8",
        md: "size-9",
        lg: "size-10",
        xl: "size-11",
    },
    field: {
        sm: "h-8 px-3 text-sm",
        md: "h-9 px-3 text-md",
        lg: "h-10 px-3 text-md",
    },
} as const;

export const controlTokens = {
    control: "rounded-md",
    group: "gap-2",
    section: "gap-4",
    block: "gap-6",
    menu: "p-1",
    menuItem: "min-h-9 px-2.5 py-2",
} as const;

export type ControlSize = keyof typeof controlScale.button;
export type FieldSize = keyof typeof controlScale.field;
