import { ArrowRight, ExternalLink, Gauge, ListChecks } from "lucide-react";
import { Link, useParams } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { Skeleton } from "@/components/base/feedback/skeleton";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorMessage } from "@/components/feedback/error-message";
import { AppIcons } from "@/components/foundations/icons";
import { useColumns } from "@/features/board/hooks/use-board";
import { useCycles, useIssues } from "@/features/issues/hooks/use-issues";
import { ProjectWorkspaceHeader } from "@/features/projects/components/project-workspace-header";
import { useProject } from "@/features/projects/hooks/use-project";

export const ProjectOverviewPage = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { data: project, isLoading, isError } = useProject(projectId!);
    const { data: issues, isLoading: issuesLoading, isError: issuesError } = useIssues(projectId!);
    const { data: columns, isLoading: columnsLoading, isError: columnsError } = useColumns(projectId!);
    const { data: cycles, isLoading: cyclesLoading, isError: cyclesError } = useCycles(projectId!);
    const activeCycle = cycles?.find((cycle) => cycle.status === "active");
    const totalEstimate = (issues ?? []).reduce((total, issue) => total + (issue.estimate ?? 0), 0);
    const overviewLoading = isLoading || issuesLoading || columnsLoading || cyclesLoading;
    const overviewError = isError || issuesError || columnsError || cyclesError;

    return (
        <div className="flex h-full min-h-0 flex-col bg-surface-1">
            <ProjectWorkspaceHeader projectId={projectId!} activeView="overview" />
            <main className="mx-auto min-h-0 w-full max-w-6xl flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
                {overviewLoading ? (
                    <OverviewSkeleton />
                ) : overviewError || !project ? (
                    <ErrorMessage message="Could not load the project overview." />
                ) : (
                <div className="flex flex-col">
                    <header className="flex flex-wrap items-start justify-between gap-6 border-b border-subtle pb-6">
                        <div className="min-w-0">
                            <p className="font-mono text-xs text-accent-primary">{project.issueKey}</p>
                            <h1 className="mt-1 text-display-sm font-semibold tracking-tight text-primary">{project.name}</h1>
                            {project.description && <p className="mt-2 max-w-2xl text-sm leading-6 text-tertiary">{project.description}</p>}
                        </div>
                        {project.repositoryUrl && (
                            <Button href={project.repositoryUrl} target="_blank" rel="noopener noreferrer" color="secondary" size="sm" iconLeading={ExternalLink}>
                                Repository
                            </Button>
                        )}
                    </header>

                    <section className="grid gap-6 border-b border-subtle py-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
                        <div>
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-sm font-semibold text-primary">Project status</h2>
                                    <p className="mt-1 text-sm text-tertiary">A quick view of the work across your workflow.</p>
                                </div>
                                <span className="text-xs text-tertiary">{issuesLoading ? "..." : `${issues?.length ?? 0} issues`}</span>
                            </div>
                            <div className="mt-4 divide-y divide-subtle rounded-lg border border-subtle">
                                {(columns ?? []).map((column) => {
                                    const count = (issues ?? []).filter((issue) => issue.columnId === column.id).length;
                                    return (
                                        <div key={column.id} className="flex items-center justify-between gap-4 px-3 py-2">
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

                        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
                            <Fact icon={Gauge} label="Active cycle" value={activeCycle?.name ?? "No active cycle"} />
                            <Fact icon={ListChecks} label="Estimate" value={`${totalEstimate} points`} />
                        </div>
                    </section>

                    <section className="py-6">
                        <div className="mb-4">
                            <h2 className="text-sm font-semibold text-primary">Project views</h2>
                            <p className="mt-1 text-sm text-tertiary">Choose the workspace that matches the way you want to work.</p>
                        </div>
                        <div className="divide-y divide-subtle rounded-lg border border-subtle">
                            <OverviewLink href={`/projects/${projectId}/issues`} icon={AppIcons.Issues} title="Issues" description="Browse, filter, and update the project work." />
                            <OverviewLink href={`/projects/${projectId}/board`} icon={AppIcons.Board} title="Board" description="Move issues through their statuses." />
                            <OverviewLink href={`/projects/${projectId}/documents`} icon={AppIcons.Documents} title="Documents" description="Keep the project's main document in one place." />
                        </div>
                    </section>

                    {!issuesLoading && issues?.length === 0 && <EmptyState title="No issues yet" description="Create an issue from the Issues view to start tracking work in this project." />}
                </div>
                )}
            </main>
        </div>
    );
};

function OverviewSkeleton() {
    return (
        <div className="flex flex-col" role="status" aria-label="Loading project overview" aria-live="polite">
            <div className="space-y-3 border-b border-subtle pb-6">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-8 w-72 max-w-full" />
                <Skeleton className="h-4 w-96 max-w-full" />
            </div>
            <div className="grid gap-6 border-b border-subtle py-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
                <div className="space-y-4">
                    <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-64 max-w-full" /></div>
                    <div className="space-y-3 rounded-lg border border-subtle p-4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-1"><Skeleton className="h-20 rounded-lg" /><Skeleton className="h-20 rounded-lg" /></div>
            </div>
            <section className="space-y-4 py-6">
                <div className="space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-4 w-72 max-w-full" /></div>
                <div className="space-y-3 rounded-lg border border-subtle p-4"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
            </section>
        </div>
    );
}

function Fact({ icon: Icon, label, value }: { icon: typeof Gauge; label: string; value: string }) {
    return (
        <div className="rounded-lg border border-subtle p-4">
            <div className="flex items-center gap-2 text-xs text-tertiary">
                <Icon className="size-3.5 text-placeholder" aria-hidden="true" />
                <span>{label}</span>
            </div>
            <p className="mt-2 truncate text-sm font-medium text-primary">{value}</p>
        </div>
    );
}

function OverviewLink({ href, icon: Icon, title, description }: { href: string; icon: typeof AppIcons.Issues; title: string; description: string }) {
    return (
        <Link to={href} className="group flex items-center gap-4 px-3 py-3 transition hover:bg-surface-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-2 text-placeholder group-hover:text-accent-primary">
                <Icon className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-primary">{title}</span>
                <span className="mt-0.5 block truncate text-sm text-tertiary">{description}</span>
            </span>
            <ArrowRight className="size-4 shrink-0 text-placeholder transition group-hover:translate-x-0.5 group-hover:text-accent-primary" aria-hidden="true" />
        </Link>
    );
}
