import type { ReactNode } from "react";
import { Dialog, DialogTrigger, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { CloseButton } from "@/components/base/buttons/close-button";

interface ModalDialogProps {
    trigger: ReactNode;
    title: string;
    description?: string;
    children: (args: { close: () => void }) => ReactNode;
}

export const ModalDialog = ({ trigger, title, description, children }: ModalDialogProps) => {
    return (
        <DialogTrigger>
            {trigger}
            <ModalOverlay>
                <Modal className="max-w-md">
                    <Dialog>
                        {({ close }) => (
                            <div className="w-full rounded-xl bg-primary p-6 shadow-xl ring-1 ring-secondary">
                                <div className="mb-4 flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-lg font-semibold text-primary">{title}</h2>
                                        {description && <p className="mt-1 text-sm text-tertiary">{description}</p>}
                                    </div>
                                    <CloseButton size="sm" onPress={close} />
                                </div>
                                {children({ close })}
                            </div>
                        )}
                    </Dialog>
                </Modal>
            </ModalOverlay>
        </DialogTrigger>
    );
};
