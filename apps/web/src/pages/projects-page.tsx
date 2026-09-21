import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorMessage } from "@/components/feedback/error-message";
import { Skeleton } from "@/components/base/feedback/skeleton";
import { Topbar } from "@/components/layout/topbar";
import { CreateProjectModal } from "@/features/projects/components/create-project-modal";
import { ProjectCard } from "@/features/projects/components/project-card";
import { useProjects } from "@/features/projects/hooks/use-projects";
import { useTranslation } from "react-i18next";

export const ProjectsPage = () => {
    const { data: projects, isLoading, isError } = useProjects();
    const { t } = useTranslation();

    return (
        <div className="flex h-full min-h-0 flex-col">
            <Topbar title={t("nav.projects")} actions={<CreateProjectModal />} />
            <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
                {isLoading && <ProjectListSkeleton />}

                {isError && <ErrorMessage message={t("projects.couldNotLoad")} />}

                {!isLoading && !isError && projects?.length === 0 && (
                    <EmptyState title={t("projects.noProjects")} description={t("projects.createFirst")} action={<CreateProjectModal />} />
                )}

                {projects && projects.length > 0 && <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">{projects.map((project) => <ProjectCard key={project.id} project={project} />)}</div>}
            </div>
        </div>
    );
};

function ProjectListSkeleton() {
    const { t } = useTranslation();
    return <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3" aria-label={t("common.loading")} role="status">{["one", "two", "three"].map((key) => <div key={key} className="h-[222px] overflow-hidden rounded-lg border border-subtle"><Skeleton className="h-[118px] rounded-none" /><div className="space-y-3 p-4"><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-3/5" /></div></div>)}</div>;
}
