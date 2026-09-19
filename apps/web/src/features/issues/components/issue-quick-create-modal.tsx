import { useState } from "react";
import { AlertCircle, FilePlus2 } from "lucide-react";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { Input } from "@/components/base/input/input";
import { ApiError } from "@/lib/api-client";
import { EMPTY_TIPTAP_DOCUMENT } from "./rich-text-editor";
import { useCreateIssue } from "../hooks/use-issues";

interface IssueQuickCreateModalProps {
    projectId: string;
    columnId: string;
    onClose: () => void;
    onCreated?: (identifier: string) => void;
}

export const IssueQuickCreateModal = ({ projectId, columnId, onClose, onCreated }: IssueQuickCreateModalProps) => {
    const [title, setTitle] = useState("");
    const [error, setError] = useState<string | null>(null);
    const createIssue = useCreateIssue(projectId);

    function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            setError("Add a title to create the issue.");
            return;
        }

        setError(null);
        createIssue.mutate(
            { columnId, title: trimmedTitle, descriptionJson: EMPTY_TIPTAP_DOCUMENT, priority: "medium" },
            {
                onSuccess: (issue) => {
                    onCreated?.(issue.identifier);
                    onClose();
                },
                onError: (reason) => setError(reason instanceof ApiError ? reason.message : "Could not create the issue."),
            },
        );
    }

    return (
        <ModalOverlay isOpen onOpenChange={(open) => !open && onClose()} isDismissable>
            <Modal className="max-w-md">
                <Dialog>
                    <div className="w-full rounded-xl bg-surface-1 p-6 shadow-xl ring-1 ring-subtle">
                        <div className="mb-4 flex items-start justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 text-accent-primary">
                                    <FilePlus2 className="size-4" aria-hidden="true" />
                                    <span className="text-xs font-medium uppercase tracking-wide">New issue</span>
                                </div>
                                <h2 className="mt-2 text-lg font-semibold text-primary">What needs to be done?</h2>
                                <p className="mt-1 text-sm text-tertiary">The issue will be added to this status. You can edit its properties next.</p>
                            </div>
                            <CloseButton size="sm" onPress={onClose} />
                        </div>

                        <form className="flex flex-col gap-4" onSubmit={submit}>
                            <Input autoFocus label="Title" placeholder="Describe the work" value={title} onChange={setTitle} isRequired />
                            {error && (
                                <p role="alert" className="flex items-center gap-2 text-sm text-danger-primary">
                                    <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                                    {error}
                                </p>
                            )}
                            <div className="flex justify-end gap-2">
                                <Button type="button" color="secondary" onClick={onClose}>
                                    Cancel
                                </Button>
                                <Button type="submit" isLoading={createIssue.isPending}>
                                    Create issue
                                </Button>
                            </div>
                        </form>
                    </div>
                </Dialog>
            </Modal>
        </ModalOverlay>
    );
};
