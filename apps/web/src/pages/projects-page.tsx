import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorMessage } from "@/components/feedback/error-message";
import { LoadingState } from "@/components/feedback/loading-state";
import { Topbar } from "@/components/layout/topbar";
import { CreateProjectModal } from "@/features/projects/components/create-project-modal";
import { ProjectCard } from "@/features/projects/components/project-card";
import { useProjects } from "@/features/projects/hooks/use-projects";

export const ProjectsPage = () => {
    const { data: projects, isLoading, isError } = useProjects();

    return (
        <div className="flex h-full min-h-0 flex-col">
            <Topbar title="Projects" actions={<CreateProjectModal />} />
            <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
                {isLoading && <LoadingState label="Loading projects..." className="py-3" />}

                {isError && <ErrorMessage message="Could not load your projects. Try refreshing the page." />}

                {!isLoading && !isError && projects?.length === 0 && (
                    <EmptyState title="No projects yet" description="Create your first project to start organizing your work." action={<CreateProjectModal />} />
                )}

                {projects && projects.length > 0 && (
                    <div className="overflow-hidden rounded-lg border border-secondary">
                        <div className="hidden items-center gap-3 border-b border-secondary bg-secondary px-3 py-2 text-xs font-medium text-tertiary sm:flex">
                            <span className="w-8 shrink-0" />
                            <span className="flex-1">Project</span>
                            <span className="w-28 text-right">Updated</span>
                            <span className="w-4 shrink-0" />
                        </div>
                        <div className="divide-y divide-secondary">
                            {projects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
