import type { ComponentProps } from "react";
import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { cx } from "@/utils/cx";

export const ToggleGroupRoot = ({ className, ...props }: ComponentProps<typeof ToggleGroup>) => (
    <ToggleGroup {...props} className={(state) => cx("inline-flex items-center gap-1", typeof className === "function" ? className(state) : className)} />
);

export const ToggleGroupItem = ({ className, ...props }: ComponentProps<typeof Toggle>) => (
    <Toggle {...props} className={(state) => cx("inline-flex size-8 items-center justify-center rounded-md text-tertiary outline-accent-strong transition-colors hover:bg-layer-1-hover hover:text-primary data-pressed:bg-surface-2 data-pressed:text-primary", typeof className === "function" ? className(state) : className)} />
);
