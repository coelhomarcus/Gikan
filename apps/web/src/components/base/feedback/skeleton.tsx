import type { ComponentProps } from "react";
import { cx } from "@/utils/cx";

export const Skeleton = ({ className, ...props }: ComponentProps<"div">) => <div {...props} aria-hidden="true" className={cx("animate-pulse rounded-md bg-secondary", className)} />;
