import { Suspense, lazy } from "react";
import { Popover } from "@base-ui/react/popover";
import { updateProjectSchema } from "@gikan/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/base/buttons/button";
import { Alert } from "@/components/base/feedback/alert";
import { ErrorMessage } from "@/components/feedback/error-message";
import { LoadingState } from "@/components/feedback/loading-state";
import { ControlledSettingsInput as ControlledInput, ControlledSettingsDescription } from "@/components/settings/settings-input";
import { SettingsControl } from "@/components/settings/settings-layout";
import { ApiError } from "@/lib/api-client";
import { useProject } from "../hooks/use-project";
import { useUpdateProject } from "../hooks/use-projects";
import { DeleteProjectDialog } from "./delete-project-dialog";
import { useTranslation } from "react-i18next";
import { DEFAULT_PROJECT_ICON, ProjectIcon } from "./project-icon";

const ProjectIconPicker = lazy(() => import("./project-icon-picker").then((module) => ({ default: module.ProjectIconPicker })));

export const ProjectDetailsPanel = ({ projectId, isProjectOwner }: { projectId: string; isProjectOwner: boolean }) => {
    const { t } = useTranslation();
    const { data: project, isLoading, isError } = useProject(projectId);
    const mutation = useUpdateProject(projectId);
    const { control, handleSubmit, setError, formState } = useForm({
        resolver: zodResolver(updateProjectSchema),
        values: project
            ? {
                  name: project.name,
                  issueKey: project.issueKey,
                  description: project.description ?? "",
                  repositoryUrl: project.repositoryUrl ?? "",
                  icon: (project.icon as typeof DEFAULT_PROJECT_ICON | null) ?? DEFAULT_PROJECT_ICON,
              }
            : undefined,
    });
    if (isLoading) return <LoadingState label={t("settings.loadingProject")} />;
    if (isError || !project) return <ErrorMessage message={t("settings.couldNotLoadProject")} />;
    const disabled = !isProjectOwner || mutation.isPending;

    return (
        <div>
            <form
                noValidate
                onSubmit={handleSubmit((data) =>
                    mutation.mutate(data, {
                        onError: (error) => setError("root", { message: error instanceof ApiError ? error.message : t("settings.couldNotSaveProject") }),
                    }),
                )}
            >
                <div className="relative flex h-44 items-end overflow-hidden rounded-md border border-subtle bg-surface-2 p-4">
                    <div className="flex min-w-0 items-center gap-3">
                        <Controller
                            control={control}
                            name="icon"
                            render={({ field }) => (
                                <Popover.Root>
                                    <Popover.Trigger
                                        disabled={disabled}
                                        aria-label={t("settings.changeProjectIcon")}
                                        className="flex size-11 shrink-0 items-center justify-center rounded-md border border-subtle bg-layer-2 outline-accent-strong hover:bg-layer-2-hover"
                                    >
                                        <ProjectIcon icon={field.value} className="size-6" />
                                    </Popover.Trigger>
                                    <Popover.Portal>
                                        <Popover.Positioner sideOffset={8} className="z-50">
                                            <Popover.Popup className="max-h-[calc(100dvh-2rem)] w-80 max-w-[90vw] overflow-hidden rounded-md border border-subtle bg-layer-2 p-4 shadow-overlay-200 outline-none">
                                                <Popover.Title className="sr-only">{t("settings.projectIcon")}</Popover.Title>
                                                <Suspense fallback={<LoadingState label={t("settings.loadingIcons")} />}>
                                                    <ProjectIconPicker value={field.value} onChange={field.onChange} />
                                                </Suspense>
                                            </Popover.Popup>
                                        </Popover.Positioner>
                                    </Popover.Portal>
                                </Popover.Root>
                            )}
                        />
                        <div className="min-w-0">
                            <h1 className="text-base truncate font-semibold">{project.name}</h1>
                            <p className="mt-1 text-sm text-tertiary">{project.issueKey}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex flex-col gap-8">
                    <ControlledInput control={control} name="name" label={t("projects.projectName")} isRequired isDisabled={disabled} />
                    <ControlledSettingsDescription control={control} name="description" isDisabled={disabled} />
                    <div className="grid gap-6 md:grid-cols-2">
                        <ControlledInput
                            control={control}
                            name="issueKey"
                            label={t("projects.projectId")}
                            isDisabled={disabled || project.nextIssueNumber > 1}
                            hint={
                                project.nextIssueNumber > 1 ? t("settings.projectIdLocked") : t("projects.projectIssueKeyHint")
                            }
                        />
                        <ControlledInput
                            control={control}
                            name="repositoryUrl"
                            label={t("projects.repository")}
                            isDisabled={disabled}
                            placeholder="https://github.com/..."
                        />
                    </div>
                    {formState.errors.root && <Alert tone="error">{formState.errors.root.message}</Alert>}
                    {mutation.isSuccess && !formState.isDirty && <Alert tone="success">{t("settings.projectDetailsSaved")}</Alert>}
                    {isProjectOwner && (
                        <div className="py-2">
                            <Button type="submit" size="lg" isLoading={mutation.isPending} isDisabled={!formState.isDirty}>
                                {t("common.saveChanges")}
                            </Button>
                        </div>
                    )}
                </div>
            </form>
            {isProjectOwner && (
                <div className="mt-10">
                    <SettingsControl
                        title={t("projects.deleteProject")}
                        description={t("settings.deleteProjectDescription")}
                    >
                        <DeleteProjectDialog project={project} />
                    </SettingsControl>
                </div>
            )}
        </div>
    );
};
