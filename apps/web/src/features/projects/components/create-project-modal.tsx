import { Suspense, lazy } from "react";
import { createProjectSchema, suggestProjectKey } from "@gikan/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
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
        defaultValues: { name: "", issueKey: "", description: "", repositoryUrl: "", icon: DEFAULT_PROJECT_ICON },
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
                                reset();
                                close();
                                navigate(`/projects/${project.id}`);
                            },
                            onError: (error) => {
                                setError(error instanceof ApiError && error.status === 409 ? "issueKey" : "root", {
                                    message: error instanceof ApiError ? error.message : "Could not create the project",
                                });
                            },
                        });
                    })}
                >
                    <ControlledInput control={control} name="name" label="Name" isRequired autoFocus />
                    <Controller
                        control={control}
                        name="issueKey"
                        render={({ field, fieldState }) => (
                            <Input
                                {...field}
                                value={field.value ?? ""}
                                onChange={(value) => field.onChange(value.toUpperCase())}
                                label="Project ID"
                                placeholder={projectName.trim() ? generatedIssueKey : "PRJ"}
                                maxLength={8}
                                isInvalid={!!fieldState.error}
                                inputClassName="uppercase"
                                hint={fieldState.error?.message ?? "2–8 letters or numbers, used in issue identifiers. Leave blank to generate automatically."}
                            />
                        )}
                    />
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
