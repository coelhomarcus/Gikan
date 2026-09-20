import { useEffect, useState, type ReactElement } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { WarningTriangleOutline as AlertTriangle } from "@makeplane/propel/icons";
import { Button } from "@/components/base/buttons/button";
import { Alert } from "@/components/base/feedback/alert";
import { Input } from "@/components/base/input/input";
import { ApiError } from "@/lib/api-client";
import type { Project } from "../api";
import { useDeleteProject } from "../hooks/use-projects";
import { useTranslation } from "react-i18next";

interface DeleteProjectDialogProps {
    project: Pick<Project, "id" | "name" | "issueKey">;
    trigger?: ReactElement;
    hideTrigger?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function DeleteProjectDialog({ project, trigger, hideTrigger = false, open: controlledOpen, onOpenChange }: DeleteProjectDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [name, setName] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const { t, i18n } = useTranslation();
    const mutation = useDeleteProject(project);
    const open = controlledOpen ?? internalOpen;
    function changeOpen(next: boolean) {
        if (mutation.isPending) return;
        if (controlledOpen === undefined) setInternalOpen(next);
        onOpenChange?.(next);
        if (next) {
            setName("");
            setConfirmation("");
            mutation.reset();
        }
    }
    const confirmationPhrase = t("projects.deletePhrase");
    useEffect(() => setConfirmation(""), [i18n.language]);
    const canDelete = name === project.name && confirmation === confirmationPhrase;
    return (
        <Dialog.Root
            open={open}
            onOpenChange={changeOpen}
        >
            {!hideTrigger && <Dialog.Trigger render={trigger ?? <Button color="secondary-destructive" size="lg" />}>{t("projects.deleteProject")}</Dialog.Trigger>}
            <Dialog.Portal>
                <Dialog.Backdrop className="fixed inset-0 z-50 bg-overlay/70" />
                <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
                    <Dialog.Popup className="max-h-full w-full max-w-lg overflow-y-auto rounded-lg border border-subtle bg-surface-1 p-6 shadow-overlay-200 outline-none">
                        <form
                            className="flex flex-col gap-6"
                            onSubmit={(event) => {
                                event.preventDefault();
                                if (canDelete && !mutation.isPending) mutation.mutate(undefined, { onSuccess: () => changeOpen(false) });
                            }}
                        >
                            <div className="flex items-start gap-4">
                                <span className="rounded-full bg-danger-subtle p-4 text-danger-primary">
                                    <AlertTriangle className="size-6" />
                                </span>
                                <div className="min-w-0 space-y-2">
                                    <Dialog.Title className="text-lg font-medium">{t("projects.deleteProject")}</Dialog.Title>
                                    <Dialog.Description className="text-sm text-tertiary">
                                        {t("projects.deleteDescription", { name: project.name })}
                                    </Dialog.Description>
                                </div>
                            </div>
                            <Input label={t("projects.enterProjectName")} value={name} onChange={setName} isDisabled={mutation.isPending} autoComplete="off" />
                            <Input
                                label={t("projects.deleteProjectPrompt", { phrase: confirmationPhrase })}
                                value={confirmation}
                                onChange={setConfirmation}
                                isDisabled={mutation.isPending}
                                autoComplete="off"
                            />
                            {mutation.isError && (
                                <Alert tone="error">
                                    {mutation.error instanceof ApiError ? mutation.error.message : t("projects.couldNotDelete")}
                                </Alert>
                            )}
                            <div className="flex justify-end gap-2">
                                <Button color="secondary" size="lg" isDisabled={mutation.isPending} onClick={() => changeOpen(false)}>
                                    {t("common.cancel")}
                                </Button>
                                <Button type="submit" color="primary-destructive" size="lg" isDisabled={!canDelete} isLoading={mutation.isPending}>
                                    {t("projects.confirmDelete")}
                                </Button>
                            </div>
                        </form>
                    </Dialog.Popup>
                </Dialog.Viewport>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
