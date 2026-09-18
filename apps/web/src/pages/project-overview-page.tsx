import { ArrowRight, ExternalLink, Gauge, ListChecks } from "lucide-react";
import { Link, useParams } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorMessage } from "@/components/feedback/error-message";
import { LoadingState } from "@/components/feedback/loading-state";
import { AppIcons } from "@/components/foundations/icons";
import { useColumns } from "@/features/board/hooks/use-board";
import { useCycles, useIssues } from "@/features/issues/hooks/use-issues";
import { ProjectWorkspaceHeader } from "@/features/projects/components/project-workspace-header";
import { useProject } from "@/features/projects/hooks/use-project";

export const ProjectOverviewPage = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { data: project, isLoading, isError } = useProject(projectId!);
    const { data: issues, isLoading: issuesLoading } = useIssues(projectId!);
    const { data: columns, isLoading: columnsLoading } = useColumns(projectId!);
    const { data: cycles } = useCycles(projectId!);
    const activeCycle = cycles?.find((cycle) => cycle.status === "active");
    const totalEstimate = (issues ?? []).reduce((total, issue) => total + (issue.estimate ?? 0), 0);

    if (isLoading) return <LoadingState label="Loading project..." className="p-6" />;
    if (isError || !project) return <ErrorMessage message="Could not load the project." />;

    return (
        <div className="flex h-full min-h-0 flex-col bg-primary">
            <ProjectWorkspaceHeader projectId={projectId!} activeView="overview" />
            <main className="mx-auto min-h-0 w-full max-w-6xl flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
                <div className="flex flex-col">
                    <header className="flex flex-wrap items-start justify-between gap-5 border-b border-secondary pb-6">
                        <div className="min-w-0">
                            <p className="font-mono text-xs text-fg-brand-primary">{project.issueKey}</p>
                            <h1 className="mt-1 text-display-sm font-semibold tracking-tight text-primary">{project.name}</h1>
                            {project.description && <p className="mt-2 max-w-2xl text-sm leading-6 text-tertiary">{project.description}</p>}
                        </div>
                        {project.repositoryUrl && (
                            <Button href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" color="secondary" size="sm" iconLeading={ExternalLink}>
                                Repository
                            </Button>
                        )}
                    </header>

                    <section className="grid gap-8 border-b border-secondary py-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
                        <div>
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-sm font-semibold text-primary">Project status</h2>
                                    <p className="mt-1 text-sm text-tertiary">A quick view of the work across your workflow.</p>
                                </div>
                                <span className="text-xs text-tertiary">{issuesLoading ? "..." : `${issues?.length ?? 0} issues`}</span>
                            </div>
                            <div className="mt-5 divide-y divide-secondary rounded-lg border border-secondary">
                                {(columns ?? []).map((column) => {
                                    const count = (issues ?? []).filter((issue) => issue.columnId === column.id).length;
                                    return (
                                        <div key={column.id} className="flex items-center justify-between gap-4 px-3 py-2.5">
                                            <div className="flex min-w-0 items-center gap-2">
                                                <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: column.color ?? "#87888c" }} />
                                                <span className="truncate text-sm text-secondary">{column.name}</span>
                                            </div>
                                            <span className="font-mono text-xs text-tertiary">{issuesLoading ? "—" : count}</span>
                                        </div>
                                    );
                                })}
                                {!columnsLoading && columns?.length === 0 && <div className="px-3 py-4 text-sm text-tertiary">Add a status to start organizing issues.</div>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                            <Fact icon={Gauge} label="Active cycle" value={activeCycle?.name ?? "No active cycle"} />
                            <Fact icon={ListChecks} label="Estimate" value={`${totalEstimate} points`} />
                        </div>
                    </section>

                    <section className="py-6">
                        <div className="mb-3">
                            <h2 className="text-sm font-semibold text-primary">Project views</h2>
                            <p className="mt-1 text-sm text-tertiary">Choose the workspace that matches the way you want to work.</p>
                        </div>
                        <div className="divide-y divide-secondary rounded-lg border border-secondary">
                            <OverviewLink href={`/projects/${projectId}/issues`} icon={AppIcons.Issues} title="Issues" description="Browse, filter, and update the project work." />
                            <OverviewLink href={`/projects/${projectId}/board`} icon={AppIcons.Board} title="Board" description="Move issues through their statuses." />
                            <OverviewLink href={`/projects/${projectId}/documents`} icon={AppIcons.Documents} title="Documents" description="Keep the project's main document in one place." />
                        </div>
                    </section>

                    {!issuesLoading && issues?.length === 0 && <EmptyState title="No issues yet" description="Create an issue from the Issues view to start tracking work in this project." />}
                </div>
            </main>
        </div>
    );
};

function Fact({ icon: Icon, label, value }: { icon: typeof Gauge; label: string; value: string }) {
    return (
        <div className="rounded-lg border border-secondary px-3 py-3">
            <div className="flex items-center gap-2 text-xs text-tertiary">
                <Icon className="size-3.5 text-fg-quaternary" aria-hidden="true" />
                <span>{label}</span>
            </div>
            <p className="mt-2 truncate text-sm font-medium text-primary">{value}</p>
        </div>
    );
}

function OverviewLink({ href, icon: Icon, title, description }: { href: string; icon: typeof AppIcons.Issues; title: string; description: string }) {
    return (
        <Link to={href} className="group flex items-center gap-3 px-3 py-3.5 transition hover:bg-secondary">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-fg-quaternary group-hover:text-fg-brand-primary">
                <Icon className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-primary">{title}</span>
                <span className="mt-0.5 block truncate text-sm text-tertiary">{description}</span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-fg-quaternary transition group-hover:translate-x-0.5 group-hover:text-fg-brand-primary" aria-hidden="true" />
        </Link>
    );
}
