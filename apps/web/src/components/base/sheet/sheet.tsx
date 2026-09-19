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
            <BaseDialog.Backdrop className="fixed inset-0 z-30 bg-transparent" />
            <BaseDialog.Viewport className="fixed inset-0 z-40 flex justify-end md:top-10 md:right-2 md:bottom-2 md:left-2">
                <BaseDialog.Popup className={cx("flex h-full w-full min-w-0 flex-col border-l border-subtle bg-surface-1 outline-none md:w-1/2 md:rounded-r-lg", className)}>
                    <BaseDialog.Title className="sr-only">{title}</BaseDialog.Title>
                    {children}
                </BaseDialog.Popup>
            </BaseDialog.Viewport>
        </BaseDialog.Portal>
    </BaseDialog.Root>
);
