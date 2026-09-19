import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Dialog, DialogTrigger, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";

interface ConfirmDialogProps {
    /** Element that opens the dialog (usually the destructive action's button). */
    trigger: ReactNode;
    title: string;
    description: string;
    /** Text for the confirmation button. It should name the action instead of using a generic "OK". */
    confirmLabel: string;
    isPending?: boolean;
    onConfirm: () => void;
}

/**
 * Confirmation for destructive actions. The trigger is passed as a prop (the `ModalDialog`
 * pattern), so callers only need to replace the button's `onClick` with this wrapper without
 * managing state.
 */
export const ConfirmDialog = ({ trigger, title, description, confirmLabel, isPending, onConfirm }: ConfirmDialogProps) => {
    return (
        <DialogTrigger>
            {trigger}
            <ModalOverlay>
                <Modal className="max-w-md">
                    <Dialog>
                        {({ close }) => (
                            <div className="w-full rounded-xl bg-surface-1 p-6 shadow-xl ring-1 ring-subtle">
                                <div className="flex gap-4">
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger-primary text-fg-white">
                                        <AlertTriangle className="size-5" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-lg font-semibold text-primary">{title}</h2>
                                        <p className="mt-1 text-sm text-tertiary">{description}</p>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <Button type="button" color="secondary" onClick={close}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        color="primary-destructive"
                                        isLoading={isPending}
                                        onClick={() => {
                                            onConfirm();
                                            close();
                                        }}
                                    >
                                        {confirmLabel}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </DialogTrigger>
    );
};
