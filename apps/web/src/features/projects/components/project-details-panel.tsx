import { updateProjectSchema } from "@gikan/shared";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink } from "lucide-react";
import { lazy, Suspense } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/base/buttons/button";
import { ErrorMessage } from "@/components/feedback/error-message";
import { LoadingState } from "@/components/feedback/loading-state";
import { ControlledInput } from "@/components/form/controlled-input";
import { ControlledTextarea } from "@/components/form/controlled-textarea";
import { ApiError } from "@/lib/api-client";
import { useProject } from "../hooks/use-project";
import { useUpdateProject } from "../hooks/use-projects";
import { DEFAULT_PROJECT_ICON, ProjectIcon } from "./project-icon";

const ProjectIconPicker = lazy(() => import("./project-icon-picker").then((module) => ({ default: module.ProjectIconPicker })));

interface ProjectDetailsPanelProps {
    projectId: string;
    isProjectOwner: boolean;
}

export const ProjectDetailsPanel = ({ projectId, isProjectOwner }: ProjectDetailsPanelProps) => {
    const { data: project, isLoading, isError } = useProject(projectId);
    const mutation = useUpdateProject(projectId);

    // No explicit generic on useForm: updateProjectSchema has `.transform()` on `repositoryUrl`
    // (same pattern as updateProfileSchema.avatarUrl), which creates different input/output types
    // in Zod — letting TypeScript infer from the resolver avoids the type error seen previously.
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

    if (isLoading) return <LoadingState label="Loading project..." />;
    if (isError || !project) return <ErrorMessage message="Could not load the project." />;

    if (!isProjectOwner) {
        return (
            <div className="flex w-full flex-col gap-5">
                <div>
                    <p className="text-sm font-medium text-secondary">Issue key</p>
                    <p className="mt-1.5 font-mono text-sm text-fg-brand-primary">{project.issueKey}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-secondary">Name</p>
                    <p className="mt-1.5 flex items-center gap-2 text-sm text-tertiary">
                        <ProjectIcon icon={project.icon} className="size-4 shrink-0 text-fg-quaternary" />
                        {project.name}
                    </p>
                </div>
                <div>
                    <p className="text-sm font-medium text-secondary">Description</p>
                    <p className="mt-1.5 text-sm text-tertiary">{project.description || "—"}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-secondary">Repository URL</p>
                    {project.repositoryUrl ? (
                        <a
                            href={project.repositoryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1.5 inline-flex items-center gap-1.5 text-sm text-brand-secondary hover:underline"
                        >
                            {project.repositoryUrl}
                            <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
                        </a>
                    ) : (
                        <p className="mt-1.5 text-sm text-tertiary">—</p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <form
            className="flex w-full flex-col gap-5"
            noValidate
            onSubmit={handleSubmit((data) =>
                mutation.mutate(data, {
                    onError: (error) => {
                        setError("root", { message: error instanceof ApiError ? error.message : "Could not save" });
                    },
                }),
            )}
        >
            <ControlledInput control={control} name="name" label="Name" isRequired />
            <ControlledInput
                control={control}
                name="issueKey"
                label="Issue key"
                isDisabled={project.nextIssueNumber > 1}
                hint={project.nextIssueNumber > 1 ? "Locked after the first issue is created." : "2–8 uppercase letters or numbers"}
            />
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
            {mutation.isSuccess && !formState.isDirty && <p className="text-sm text-success-primary">Saved!</p>}

            <div>
                <Button type="submit" isLoading={mutation.isPending}>
                    Save
                </Button>
            </div>
        </form>
    );
};
