import type { ReactNode } from "react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { cx } from "@/utils/cx";

interface SheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    children: ReactNode;
    className?: string;
}

/** A controlled right-side panel built on Base UI Dialog primitives. */
export const Sheet = ({ open, onOpenChange, title, children, className }: SheetProps) => (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
        <BaseDialog.Portal>
            <BaseDialog.Backdrop className="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px]" />
            <BaseDialog.Viewport className="fixed inset-0 z-40 flex justify-end">
                <BaseDialog.Popup className={cx("flex h-full w-full min-w-0 flex-col border-l border-secondary bg-primary shadow-2xl outline-none sm:w-[min(52rem,calc(100vw-3rem))]", className)}>
                    <BaseDialog.Title className="sr-only">{title}</BaseDialog.Title>
                    {children}
                </BaseDialog.Popup>
            </BaseDialog.Viewport>
        </BaseDialog.Portal>
    </BaseDialog.Root>
);
