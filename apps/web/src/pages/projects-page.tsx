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
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {projects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
