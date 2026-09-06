import type { HTMLAttributes } from "react";
import { cx } from "@/utils/cx";

export const AppLogo = (props: HTMLAttributes<HTMLDivElement>) => {
    return (
        <div {...props} className={cx("flex items-center gap-2", props.className)}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-solid font-mono text-sm font-bold text-white">TK</span>
            <span className="text-md font-semibold whitespace-nowrap text-primary">TodoKanban</span>
        </div>
    );
};
