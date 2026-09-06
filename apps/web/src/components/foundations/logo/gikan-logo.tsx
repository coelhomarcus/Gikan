import type { HTMLAttributes } from "react";
import { cx } from "@/utils/cx";
import { GikanIcon } from "./gikan-icon";

export const GikanLogo = (props: HTMLAttributes<HTMLDivElement>) => {
    return (
        <div {...props} className={cx("flex items-center gap-2", props.className)}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-solid p-1.5 text-white">
                <GikanIcon className="size-full" />
            </span>
            <span className="text-md font-semibold whitespace-nowrap text-primary">Gikan</span>
        </div>
    );
};
