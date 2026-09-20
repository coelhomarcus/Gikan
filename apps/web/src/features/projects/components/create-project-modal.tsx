import { Suspense, lazy, useState } from "react";
import { createProjectSchema, suggestProjectKey } from "@gikan/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { Popover } from "@base-ui/react/popover";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { ControlledInput } from "@/components/form/controlled-input";
import { ControlledTextarea } from "@/components/form/controlled-textarea";
import { ModalDialog } from "@/components/overlay/modal-dialog";
import { ApiError } from "@/lib/api-client";
import { useCreateProject } from "../hooks/use-projects";
import { DEFAULT_PROJECT_ICON, ProjectIcon } from "./project-icon";

const ProjectIconPicker = lazy(() => import("./project-icon-picker").then((module) => ({ default: module.ProjectIconPicker })));

export const CreateProjectModal = () => {
    const mutation = useCreateProject();
    const navigate = useNavigate();
    const [iconPickerOpen, setIconPickerOpen] = useState(false);
    const { control, handleSubmit, reset, setError, watch, formState } = useForm({
        resolver: zodResolver(createProjectSchema),
        defaultValues: { name: "", issueKey: "", description: "", repositoryUrl: "", icon: DEFAULT_PROJECT_ICON },
    });
    const projectName = watch("name");
    const generatedIssueKey = suggestProjectKey(projectName);

    return (
        <ModalDialog trigger={<Button iconLeading={Plus}>New project</Button>} title="New project" size="2xl">
            {({ close }) => (
                <form
                    className="flex flex-col gap-5"
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
                    <div className="flex min-w-0 items-stretch gap-2">
                        <Controller
                            control={control}
                            name="icon"
                            render={({ field }) => (
                                <Popover.Root open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
                                    <Popover.Trigger
                                        render={
                                            <button
                                                type="button"
                                                aria-label="Choose project icon"
                                                title="Choose project icon"
                                                className="flex size-15 shrink-0 cursor-pointer items-center justify-center rounded-md border border-subtle bg-layer-2 text-secondary outline-accent-strong transition-colors hover:bg-layer-2-hover hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
                                            />
                                        }
                                    >
                                        <ProjectIcon icon={field.value} className="size-7" />
                                    </Popover.Trigger>
                                    <Popover.Portal>
                                        <Popover.Positioner side="bottom" align="start" sideOffset={8} collisionPadding={12} className="z-[60]">
                                            <Popover.Popup className="max-h-[calc(100dvh-1.5rem)] w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-subtle bg-layer-2 p-3 shadow-overlay-200 outline-none">
                                                <Popover.Title className="sr-only">Choose project icon</Popover.Title>
                                                <Suspense fallback={<div className="h-40 animate-pulse rounded-md bg-surface-2" aria-label="Loading icons" />}>
                                                    <ProjectIconPicker
                                                        value={field.value}
                                                        label="Choose an icon"
                                                        onChange={(icon) => {
                                                            field.onChange(icon);
                                                            setIconPickerOpen(false);
                                                        }}
                                                    />
                                                </Suspense>
                                            </Popover.Popup>
                                        </Popover.Positioner>
                                    </Popover.Portal>
                                </Popover.Root>
                            )}
                        />
                        <div className="min-w-0 flex-1">
                            <ControlledInput control={control} name="name" label="Name" isRequired autoFocus />
                        </div>
                    </div>
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
                                hint={
                                    fieldState.error?.message ?? (
                                        <span className="text-xs text-tertiary/60">2–8 letters or numbers, used in issue identifiers. Leave blank to generate automatically.</span>
                                    )
                                }
                            />
                        )}
                    />
                    <ControlledTextarea control={control} name="description" label="Description" rows={3} />
                    <ControlledInput control={control} name="repositoryUrl" label="Repository URL" placeholder="https://github.com/..." />

                    {formState.errors.root && <p className="text-sm text-danger-primary">{formState.errors.root.message}</p>}

                    <div className="mt-1 flex justify-end gap-2 border-t border-subtle pt-4">
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
