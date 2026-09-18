import { useMemo, useState } from "react";
import { Plus, SearchSm } from "@untitledui/icons";
import { useLocation, useNavigate, useParams } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { ErrorMessage } from "@/components/feedback/error-message";
import { ImportanceBadge } from "@/features/board/components/importance-badge";
import { useColumns } from "@/features/board/hooks/use-board";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useCreateIssue, useCycles, useIssues } from "@/features/issues/hooks/use-issues";
import { ProjectWorkspaceHeader } from "@/features/projects/components/project-workspace-header";
import { useProject } from "@/features/projects/hooks/use-project";
import { useProjectMembers } from "@/features/projects/hooks/use-project-members";

export const ProjectIssuesPage = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { data: project } = useProject(projectId!);
    const [orderBy, setOrderBy] = useState<"position" | "priority" | "updated" | "number">("position");
    const { data: issues, isLoading, isError } = useIssues(projectId!, { orderBy });
    const { data: columns } = useColumns(projectId!);
    const { data: categories } = useCategories(projectId!);
    const { data: members } = useProjectMembers(projectId!);
    const { data: cycles } = useCycles(projectId!);
    const createIssue = useCreateIssue(projectId!);
    const [search, setSearch] = useState("");
    const [priority, setPriority] = useState("");
    const [status, setStatus] = useState("");
    const [assignee, setAssignee] = useState("");
    const [category, setCategory] = useState("");
    const [cycle, setCycle] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [title, setTitle] = useState("");

    const columnNames = useMemo(() => new Map((columns ?? []).map((column) => [column.id, column.name])), [columns]);
    const memberNames = useMemo(() => new Map((members ?? []).map((member) => [member.id, member.name])), [members]);
    const categoryNames = useMemo(() => new Map((categories ?? []).map((category) => [category.id, category.name])), [categories]);
    const cycleNames = useMemo(() => new Map((cycles ?? []).map((cycle) => [cycle.id, cycle.name])), [cycles]);
    const filteredIssues = (issues ?? []).filter((issue) => {
        const textMatch = !search || `${issue.identifier} ${issue.title}`.toLowerCase().includes(search.toLowerCase());
        return (
            textMatch &&
            (!priority || issue.priority === priority) &&
            (!status || issue.columnId === status) &&
            (!assignee || issue.assigneeId === assignee) &&
            (!category || issue.categoryId === category) &&
            (!cycle || issue.cycleId === cycle)
        );
    });

    function openIssue(identifier: string) {
        navigate(`/projects/${projectId}/issues/${identifier}`, { state: { backgroundLocation: location } });
    }

    function submitIssue() {
        if (!title.trim() || !columns?.[0]) return;
        createIssue.mutate(
            { columnId: columns[0].id, title: title.trim(), priority: "medium" },
            {
                onSuccess: (issue) => {
                    setTitle("");
                    setIsCreating(false);
                    openIssue(issue.identifier);
                },
            },
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col bg-primary">
            <ProjectWorkspaceHeader projectId={projectId!} activeView="issues" />
            <main className="mx-auto min-h-0 w-full max-w-6xl flex-1 overflow-y-auto px-4 py-5 lg:px-8">
                <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-sm text-tertiary">{project?.issueKey ?? "Project"}</p>
                        <h1 className="text-display-xs font-semibold text-primary">Issues</h1>
                    </div>
                    <Button size="sm" iconLeading={Plus} onClick={() => setIsCreating(true)}>
                        New issue
                    </Button>
                </div>

                {isCreating && (
                    <div className="flex items-center gap-2 rounded-lg border border-secondary bg-secondary_alt p-3">
                        <input
                            autoFocus
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            onKeyDown={(event) => event.key === "Enter" && submitIssue()}
                            placeholder="Issue title"
                            className="min-w-0 flex-1 bg-transparent text-sm text-primary outline-none"
                        />
                        <Button size="sm" isLoading={createIssue.isPending} onClick={submitIssue}>
                            Create
                        </Button>
                        <Button size="sm" color="tertiary" onClick={() => setIsCreating(false)}>
                            Cancel
                        </Button>
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-2 border-b border-secondary pb-3">
                    <label className="flex items-center gap-2 rounded-md border border-secondary px-2.5 py-1.5 text-sm text-tertiary">
                        <SearchSm className="size-4" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search issues"
                            className="w-44 bg-transparent text-primary outline-none"
                        />
                    </label>
                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        className="rounded-md border border-secondary bg-primary px-2.5 py-1.5 text-sm text-secondary"
                    >
                        <option value="">All statuses</option>
                        {(columns ?? []).map((column) => (
                            <option key={column.id} value={column.id}>
                                {column.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={priority}
                        onChange={(event) => setPriority(event.target.value)}
                        className="rounded-md border border-secondary bg-primary px-2.5 py-1.5 text-sm text-secondary"
                    >
                        <option value="">All priorities</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                    </select>
                    <select
                        value={assignee}
                        onChange={(event) => setAssignee(event.target.value)}
                        className="rounded-md border border-secondary bg-primary px-2.5 py-1.5 text-sm text-secondary"
                    >
                        <option value="">All assignees</option>
                        {(members ?? []).map((member) => (
                            <option key={member.id} value={member.id}>
                                {member.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={category}
                        onChange={(event) => setCategory(event.target.value)}
                        className="rounded-md border border-secondary bg-primary px-2.5 py-1.5 text-sm text-secondary"
                    >
                        <option value="">All labels</option>
                        {(categories ?? []).map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={cycle}
                        onChange={(event) => setCycle(event.target.value)}
                        className="rounded-md border border-secondary bg-primary px-2.5 py-1.5 text-sm text-secondary"
                    >
                        <option value="">All cycles</option>
                        {(cycles ?? []).map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={orderBy}
                        onChange={(event) => setOrderBy(event.target.value as typeof orderBy)}
                        className="rounded-md border border-secondary bg-primary px-2.5 py-1.5 text-sm text-secondary"
                    >
                        <option value="position">Position</option>
                        <option value="number">Issue number</option>
                        <option value="priority">Priority</option>
                        <option value="updated">Recently updated</option>
                    </select>
                </div>

                {isLoading && <p className="text-sm text-tertiary">Loading issues...</p>}
                {isError && <ErrorMessage message="Could not load the project issues." />}
                {!isLoading && !isError && (
                    <div className="overflow-hidden rounded-lg border border-secondary">
                        <div className="grid grid-cols-[minmax(0,1fr)_8rem_8rem_8rem] gap-3 border-b border-secondary px-4 py-2 text-xs font-medium text-tertiary">
                            <span>Issue</span>
                            <span>Status</span>
                            <span>Priority</span>
                            <span>Assignee</span>
                        </div>
                        {filteredIssues.map((issue) => (
                            <button
                                key={issue.id}
                                type="button"
                                onClick={() => openIssue(issue.identifier)}
                                className="grid w-full grid-cols-[minmax(0,1fr)_8rem_8rem_8rem] items-center gap-3 border-b border-secondary px-4 py-3 text-left last:border-0 hover:bg-secondary"
                            >
                                <span className="min-w-0">
                                    <span className="mr-2 font-mono text-xs text-fg-brand-primary">{issue.identifier}</span>
                                    <span className="truncate text-sm font-medium text-primary">{issue.title}</span>
                                    <span className="mt-1 block truncate text-xs text-tertiary">
                                        {issue.categoryId ? categoryNames.get(issue.categoryId) : ""}
                                        {issue.cycleId ? ` · ${cycleNames.get(issue.cycleId)}` : ""}
                                    </span>
                                </span>
                                <span className="truncate text-xs text-secondary">{columnNames.get(issue.columnId)}</span>
                                <ImportanceBadge importance={issue.priority} />
                                <span className="truncate text-xs text-tertiary">{issue.assigneeId ? memberNames.get(issue.assigneeId) : "Unassigned"}</span>
                            </button>
                        ))}
                        {filteredIssues.length === 0 && <p className="px-4 py-10 text-center text-sm text-tertiary">No issues found.</p>}
                    </div>
                )}
                </div>
            </main>
        </div>
    );
};
