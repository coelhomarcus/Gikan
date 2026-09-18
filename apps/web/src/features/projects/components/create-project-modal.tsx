import { createProjectSchema } from "@gikan/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { lazy, Suspense } from "react";
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
    const { control, handleSubmit, reset, setError, formState } = useForm({
        resolver: zodResolver(createProjectSchema),
        defaultValues: { name: "", issueKey: "", description: "", repositoryUrl: "", icon: DEFAULT_PROJECT_ICON },
    });

    return (
        <ModalDialog trigger={<Button iconLeading={Plus}>New project</Button>} title="New project">
            {({ close }) => (
                <form
                    className="flex flex-col gap-4"
                    noValidate
                    onSubmit={handleSubmit((data) => {
                        mutation.mutate(data, {
                            onSuccess: (project) => {
                                reset({ name: "", issueKey: "", description: "", repositoryUrl: "", icon: DEFAULT_PROJECT_ICON });
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
                    <ControlledInput control={control} name="issueKey" label="Issue key" placeholder="e.g. LIN" />
                    <ControlledTextarea control={control} name="description" label="Description" rows={3} />
                    <ControlledInput control={control} name="repositoryUrl" label="Repository URL" placeholder="https://github.com/..." />

                    <Controller
                        control={control}
                        name="icon"
                        render={({ field }) => (
                            <Suspense fallback={<div className="h-24 animate-pulse rounded-md bg-secondary_alt" aria-label="Loading icon picker" />}>
                                <ProjectIconPicker value={field.value} onChange={field.onChange} />
                            </Suspense>
                        )}
                    />

                    {formState.errors.root && <p className="text-sm text-error-primary">{formState.errors.root.message}</p>}

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
