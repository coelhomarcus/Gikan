import { BookOpen01, Columns03, LinkExternal01, List } from "@untitledui/icons";
import { Link, useParams } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { ErrorMessage } from "@/components/feedback/error-message";
import { useColumns } from "@/features/board/hooks/use-board";
import { useCycles, useIssues } from "@/features/issues/hooks/use-issues";
import { ProjectWorkspaceHeader } from "@/features/projects/components/project-workspace-header";
import { useProject } from "@/features/projects/hooks/use-project";

export const ProjectOverviewPage = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { data: project, isLoading, isError } = useProject(projectId!);
    const { data: issues } = useIssues(projectId!);
    const { data: columns } = useColumns(projectId!);
    const { data: cycles } = useCycles(projectId!);
    const activeCycle = cycles?.find((cycle) => cycle.status === "active");
    const totalEstimate = (issues ?? []).reduce((total, issue) => total + (issue.estimate ?? 0), 0);

    if (isLoading) return <p className="p-6 text-sm text-tertiary">Loading project...</p>;
    if (isError || !project) return <ErrorMessage message="Could not load the project." />;

    return (
        <div className="flex min-h-dvh flex-col bg-primary">
            <ProjectWorkspaceHeader projectId={projectId!} activeView="overview" />
            <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 lg:px-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <p className="font-mono text-xs text-fg-brand-primary">{project.issueKey}</p>
                        <h1 className="mt-1 text-display-sm font-semibold text-primary">{project.name}</h1>
                        {project.description && <p className="mt-2 max-w-2xl text-sm text-tertiary">{project.description}</p>}
                    </div>
                    {project.repositoryUrl && (
                        <Button href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" color="secondary" size="sm" iconLeading={LinkExternal01}>
                            Repository
                        </Button>
                    )}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                    {(columns ?? []).map((column) => (
                        <div key={column.id} className="rounded-lg border border-secondary p-4">
                            <p className="text-xs text-tertiary">{column.name}</p>
                            <p className="mt-2 text-2xl font-semibold text-primary">{(issues ?? []).filter((issue) => issue.columnId === column.id).length}</p>
                        </div>
                    ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-secondary p-4">
                        <p className="text-xs text-tertiary">Active cycle</p>
                        <p className="mt-2 text-sm font-semibold text-primary">{activeCycle?.name ?? "No active cycle"}</p>
                    </div>
                    <div className="rounded-lg border border-secondary p-4">
                        <p className="text-xs text-tertiary">Estimated work</p>
                        <p className="mt-2 text-2xl font-semibold text-primary">
                            {totalEstimate} <span className="text-sm font-normal text-tertiary">points</span>
                        </p>
                    </div>
                </div>
                <section>
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-primary">Project views</h2>
                        <span className="text-xs text-tertiary">{issues?.length ?? 0} issues</span>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <OverviewLink href={`/projects/${projectId}/issues`} icon={List} title="Issues" description="Browse and filter the project work." />
                        <OverviewLink href={`/projects/${projectId}/board`} icon={Columns03} title="Board" description="Move issues through their statuses." />
                        <OverviewLink
                            href={`/projects/${projectId}/documents`}
                            icon={BookOpen01}
                            title="Documents"
                            description="Keep the project's main document."
                        />
                    </div>
                </section>
            </main>
        </div>
    );
};

function OverviewLink({ href, icon: Icon, title, description }: { href: string; icon: typeof List; title: string; description: string }) {
    return (
        <Link to={href} className="group rounded-lg border border-secondary p-4 transition hover:border-brand hover:bg-secondary">
            <Icon className="size-5 text-fg-quaternary group-hover:text-fg-brand-primary" />
            <p className="mt-4 text-sm font-semibold text-primary">{title}</p>
            <p className="mt-1 text-sm text-tertiary">{description}</p>
        </Link>
    );
}
