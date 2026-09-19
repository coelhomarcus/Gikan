import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorMessage } from "@/components/feedback/error-message";
import { Skeleton } from "@/components/base/feedback/skeleton";
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
                {isLoading && <ProjectListSkeleton />}

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

function ProjectListSkeleton() {
    return <div className="overflow-hidden rounded-lg border border-secondary" aria-label="Loading projects" role="status">
        <div className="hidden h-9 border-b border-secondary bg-secondary sm:block" />
        <div className="divide-y divide-secondary">
            {["one", "two", "three"].map((key) => <div key={key} className="flex min-h-16 items-center gap-4 px-3 py-3">
                <Skeleton className="size-8 shrink-0 rounded-md" />
                <div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-3 w-40" /><Skeleton className="h-3 w-64 max-w-full" /></div>
                <Skeleton className="hidden h-3 w-20 sm:block" />
            </div>)}
        </div>
    </div>;
}
