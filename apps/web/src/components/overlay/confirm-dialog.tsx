import { AlertTriangle } from "@untitledui/icons";
import type { ReactNode } from "react";
import { Dialog, DialogTrigger, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";

interface ConfirmDialogProps {
    /** Elemento que abre o diálogo (normalmente o próprio botão da ação destrutiva). */
    trigger: ReactNode;
    title: string;
    description: string;
    /** Texto do botão que confirma. Deve nomear a ação ("Excluir", "Remover"), não um "OK" genérico. */
    confirmLabel: string;
    isPending?: boolean;
    onConfirm: () => void;
}

/**
 * Confirmação para ações destrutivas. O gatilho vem por prop (padrão do `ModalDialog`) pra que o
 * call site seja só trocar o `onClick` do botão por este wrapper, sem precisar controlar estado.
 */
export const ConfirmDialog = ({ trigger, title, description, confirmLabel, isPending, onConfirm }: ConfirmDialogProps) => {
    return (
        <DialogTrigger>
            {trigger}
            <ModalOverlay>
                <Modal className="max-w-md">
                    <Dialog>
                        {({ close }) => (
                            <div className="w-full rounded-xl bg-primary p-6 shadow-xl ring-1 ring-secondary">
                                <div className="flex gap-4">
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-error-secondary text-fg-error-primary">
                                        <AlertTriangle className="size-5" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <h2 className="text-lg font-semibold text-primary">{title}</h2>
                                        <p className="mt-1 text-sm text-tertiary">{description}</p>
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <Button type="button" color="secondary" onClick={close}>
                                        Cancelar
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
