import { Suspense, lazy } from "react";
import { createProjectSchema, suggestProjectKey } from "@gikan/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { ControlledInput } from "@/components/form/controlled-input";
import { ControlledTextarea } from "@/components/form/controlled-textarea";
import { ModalDialog } from "@/components/overlay/modal-dialog";
import { ApiError } from "@/lib/api-client";
import { useCreateProject } from "../hooks/use-projects";
import { DEFAULT_PROJECT_ICON } from "./project-icon";

const ProjectIconPicker = lazy(() => import("./project-icon-picker").then((module) => ({ default: module.ProjectIconPicker })));

export const CreateProjectModal = () => {
    const mutation = useCreateProject();
    const navigate = useNavigate();
    const { control, handleSubmit, reset, setError, watch, formState } = useForm({
        resolver: zodResolver(createProjectSchema),
        defaultValues: { name: "", description: "", repositoryUrl: "", icon: DEFAULT_PROJECT_ICON },
    });
    const projectName = watch("name");
    const generatedIssueKey = suggestProjectKey(projectName);

    return (
        <ModalDialog trigger={<Button iconLeading={Plus}>New project</Button>} title="New project">
            {({ close }) => (
                <form
                    className="flex flex-col gap-4"
                    noValidate
                    onSubmit={handleSubmit((data) => {
                        mutation.mutate(data, {
                            onSuccess: (project) => {
                                reset({ name: "", description: "", repositoryUrl: "", icon: DEFAULT_PROJECT_ICON });
                                close();
                                navigate(`/projects/${project.id}`);
                            },
                            onError: (error) => {
                                setError("root", { message: error instanceof ApiError ? error.message : "Could not create the project" });
                            },
                        });
                    })}
                >
                    <ControlledInput control={control} name="name" label="Name" isRequired autoFocus />
                    <div className="rounded-md border border-subtle bg-surface-2 px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-medium text-tertiary">Generated issue key</span>
                            <span className="font-mono text-sm font-semibold text-accent-primary">{projectName.trim() ? generatedIssueKey : "PRJ"}</span>
                        </div>
                        <p className="mt-1 text-xs text-tertiary">
                            This key is generated from the project name and can be changed later before the first issue.
                        </p>
                    </div>
                    <ControlledTextarea control={control} name="description" label="Description" rows={3} />
                    <ControlledInput control={control} name="repositoryUrl" label="Repository URL" placeholder="https://github.com/..." />

                    <Controller
                        control={control}
                        name="icon"
                        render={({ field }) => (
                            <Suspense fallback={<div className="h-24 animate-pulse rounded-md bg-surface-2" aria-label="Loading icon picker" />}>
                                <ProjectIconPicker value={field.value} onChange={field.onChange} />
                            </Suspense>
                        )}
                    />

                    {formState.errors.root && <p className="text-sm text-danger-primary">{formState.errors.root.message}</p>}

                    <div className="mt-2 flex justify-end gap-3">
                        <Button type="button" color="secondary" onClick={close}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={mutation.isPending}>
                            Create project
                        </Button>
                    </div>
                </form>
            )}
        </ModalDialog>
    );
};
