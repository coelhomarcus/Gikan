import { Children, createContext, useContext, useState, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { cx } from "@/utils/cx";

type CloseContext = { close: () => void };
const defaultCloseValue: CloseContext = { close: () => undefined };
const closeContext = createContext<CloseContext>(defaultCloseValue);

interface TriggerProps { children: ReactNode }
export const DialogTrigger = ({ children }: TriggerProps) => {
    const [open, setOpen] = useState(false);
    const parts = Children.toArray(children);
    const trigger = parts[0] as ReactElement;
    return (
        <BaseDialog.Root open={open} onOpenChange={setOpen}>
            <BaseDialog.Trigger render={trigger} />
            <closeContext.Provider value={{ close: () => setOpen(false) }}>{parts.slice(1)}</closeContext.Provider>
        </BaseDialog.Root>
    );
};

interface ModalOverlayProps extends Omit<ComponentProps<typeof BaseDialog.Root>, "open" | "onOpenChange" | "children"> {
    isOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    isDismissable?: boolean;
    children: ReactNode;
    className?: string;
}

const OverlayContent = ({ children, className }: Pick<ModalOverlayProps, "children" | "className">) => (
    <BaseDialog.Portal>
        <BaseDialog.Backdrop className={cx("fixed inset-0 z-50 flex min-h-dvh w-full items-end justify-center overflow-y-auto bg-overlay/70 px-4 pt-4 pb-[clamp(16px,8vh,64px)] outline-hidden backdrop-blur-[6px] sm:items-center sm:p-8", className)} />
        <BaseDialog.Viewport className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto px-4 pt-4 pb-[clamp(16px,8vh,64px)] sm:items-center sm:p-8">
            {children}
        </BaseDialog.Viewport>
    </BaseDialog.Portal>
);

export const ModalOverlay = ({ isOpen, onOpenChange, children, className, ...props }: ModalOverlayProps) => {
    const existing = useContext(closeContext);
    if (existing.close !== defaultCloseValue.close) {
        return <OverlayContent className={className}>{children}</OverlayContent>;
    }

    return (
        <BaseDialog.Root {...props} open={isOpen} onOpenChange={(open) => onOpenChange?.(open)}>
            <closeContext.Provider value={{ close: () => onOpenChange?.(false) }}>
                <OverlayContent className={className}>{children}</OverlayContent>
            </closeContext.Provider>
        </BaseDialog.Root>
    );
};

export const Modal = ({ className, children }: { className?: string; children: ReactNode }) => (
    <BaseDialog.Popup className={cx("max-h-full w-full align-middle outline-hidden max-sm:overflow-y-auto max-sm:rounded-xl", className)}>{children}</BaseDialog.Popup>
);

export const Dialog = ({ className, children }: { className?: string; children: ReactNode | ((args: CloseContext) => ReactNode) }) => {
    const context = useContext(closeContext);
    return <div className={cx("flex w-full items-center justify-center outline-hidden", className)}>{typeof children === "function" ? children(context) : children}</div>;
};
