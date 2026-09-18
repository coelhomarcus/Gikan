import { useEffect, useMemo, useRef, useState } from "react";
import type { Issue } from "@/features/issues/api";
import { ChevronDown, Filter, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import type { Location } from "react-router";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorMessage } from "@/components/feedback/error-message";
import { LoadingState } from "@/components/feedback/loading-state";
import { ImportanceBadge } from "@/features/board/components/importance-badge";
import { useColumns } from "@/features/board/hooks/use-board";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useCreateIssue, useCycles, useIssues } from "@/features/issues/hooks/use-issues";
import { ProjectWorkspaceHeader } from "@/features/projects/components/project-workspace-header";
import { useProject } from "@/features/projects/hooks/use-project";
import { useProjectMembers } from "@/features/projects/hooks/use-project-members";
import { ApiError } from "@/lib/api-client";

type OrderBy = "position" | "priority" | "updated" | "number";
type GroupBy = "none" | "status" | "assignee" | "cycle";

const orderLabels: Record<OrderBy, string> = {
    position: "Manual order",
    number: "Issue number",
    priority: "Priority",
    updated: "Recently updated",
};

export const ProjectIssuesPage = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { data: project } = useProject(projectId!);
    const orderBy = readOrder(searchParams.get("order"));
    const groupBy = readGroup(searchParams.get("group"));
    const search = searchParams.get("q") ?? "";
    const priority = searchParams.get("priority") ?? "";
    const status = searchParams.get("status") ?? "";
    const assignee = searchParams.get("assignee") ?? "";
    const category = searchParams.get("label") ?? "";
    const cycle = searchParams.get("cycle") ?? "";
    const { data: issues, isLoading, isError } = useIssues(projectId!, { orderBy });
    const { data: columns } = useColumns(projectId!);
    const { data: categories } = useCategories(projectId!);
    const { data: members } = useProjectMembers(projectId!);
    const { data: cycles } = useCycles(projectId!);
    const createIssue = useCreateIssue(projectId!);
    const [isCreating, setIsCreating] = useState(false);
    const [title, setTitle] = useState("");
    const [createError, setCreateError] = useState<string | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filterQuery, setFilterQuery] = useState("");
    const [isDisplayOpen, setIsDisplayOpen] = useState(false);
    const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
    const filterRef = useRef<HTMLDivElement>(null);
    const displayRef = useRef<HTMLDivElement>(null);

    const columnById = useMemo(() => new Map((columns ?? []).map((column) => [column.id, column])), [columns]);
    const memberById = useMemo(() => new Map((members ?? []).map((member) => [member.id, member])), [members]);
    const categoryById = useMemo(() => new Map((categories ?? []).map((item) => [item.id, item])), [categories]);
    const cycleById = useMemo(() => new Map((cycles ?? []).map((item) => [item.id, item])), [cycles]);

    const filteredIssues = useMemo(
        () =>
            (issues ?? []).filter((issue) => {
                const textMatch = !search || `${issue.identifier} ${issue.title}`.toLowerCase().includes(search.toLowerCase());
                return (
                    textMatch &&
                    (!priority || issue.priority === priority) &&
                    (!status || issue.columnId === status) &&
                    (!assignee || issue.assigneeId === assignee) &&
                    (!category || issue.categoryId === category) &&
                    (!cycle || issue.cycleId === cycle)
                );
            }),
        [assignee, category, cycle, issues, priority, search, status],
    );

    const groups = useMemo(() => {
        if (groupBy === "none") return [{ key: "all", label: null, issues: filteredIssues }];

        const grouped = new Map<string, Issue[]>();
        for (const issue of filteredIssues) {
            const key = groupBy === "status" ? issue.columnId : groupBy === "assignee" ? issue.assigneeId ?? "unassigned" : issue.cycleId ?? "no-cycle";
            grouped.set(key, [...(grouped.get(key) ?? []), issue]);
        }

        return [...grouped.entries()].map(([key, groupedIssues]) => ({
            key,
            label:
                groupBy === "status"
                    ? columnById.get(key)?.name ?? "Unknown status"
                    : groupBy === "assignee"
                      ? memberById.get(key)?.name ?? "Unassigned"
                      : cycleById.get(key)?.name ?? "No cycle",
            issues: groupedIssues,
        }));
    }, [columnById, cycleById, filteredIssues, groupBy, memberById]);
    const orderedIssues = useMemo(() => groups.flatMap((group) => group.issues), [groups]);

    useEffect(() => {
        if (selectedIssueId && !orderedIssues.some((issue) => issue.id === selectedIssueId)) setSelectedIssueId(null);
    }, [orderedIssues, selectedIssueId]);

    useEffect(() => {
        if (!isFilterOpen && !isDisplayOpen) return;
        function handlePointerDown(event: PointerEvent) {
            const target = event.target as Node;
            if (isFilterOpen && !filterRef.current?.contains(target)) setIsFilterOpen(false);
            if (isDisplayOpen && !displayRef.current?.contains(target)) setIsDisplayOpen(false);
        }
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key !== "Escape") return;
            if (isFilterOpen) setIsFilterOpen(false);
            if (isDisplayOpen) setIsDisplayOpen(false);
        }
        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isDisplayOpen, isFilterOpen]);

    useEffect(() => {
        if (!location.pathname.endsWith("/issues")) return;

        function handleListKeyDown(event: KeyboardEvent) {
            const target = event.target as HTMLElement | null;
            if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
            if (orderedIssues.length === 0) return;

            const currentIndex = orderedIssues.findIndex((issue) => issue.id === selectedIssueId);
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                const direction = event.key === "ArrowDown" ? 1 : -1;
                const nextIndex = currentIndex < 0 ? (direction === 1 ? 0 : orderedIssues.length - 1) : (currentIndex + direction + orderedIssues.length) % orderedIssues.length;
                const nextIssue = orderedIssues[nextIndex];
                setSelectedIssueId(nextIssue.id);
                document.querySelector<HTMLElement>(`[data-issue-id="${nextIssue.id}"]`)?.scrollIntoView({ block: "nearest" });
            }
            if (event.key === "Enter" && currentIndex >= 0) {
                event.preventDefault();
                openIssue(orderedIssues[currentIndex].identifier);
            }
            if (event.key === "Escape") setSelectedIssueId(null);
        }

        window.addEventListener("keydown", handleListKeyDown);
        return () => window.removeEventListener("keydown", handleListKeyDown);
    }, [location.pathname, orderedIssues, selectedIssueId]);

    function updateQuery(key: string, value: string) {
        setSearchParams(
            (current) => {
                if (value) current.set(key, value);
                else current.delete(key);
                return current;
            },
            { replace: true },
        );
    }

    function clearFilters() {
        setSearchParams(
            (current) => {
                for (const key of ["q", "priority", "status", "assignee", "label", "cycle", "group"]) current.delete(key);
                return current;
            },
            { replace: true },
        );
    }

    function filterOptions(options: Array<{ value: string; label: string }>, selectedValue: string) {
        const normalized = filterQuery.trim().toLowerCase();
        if (!normalized) return options;
        const matching = options.filter((option) => option.label.toLowerCase().includes(normalized));
        const selected = options.find((option) => option.value === selectedValue);
        return selected && !matching.some((option) => option.value === selected.value) ? [selected, ...matching] : matching;
    }

    function openIssue(identifier: string) {
        navigate(`/projects/${projectId}/issues/${identifier}`, { state: { backgroundLocation: location } });
    }

    function submitIssue() {
        if (!title.trim()) {
            setCreateError("Add a title to create the issue.");
            return;
        }
        if (!columns?.[0]) {
            setCreateError("Create a status before adding an issue.");
            return;
        }
        setCreateError(null);
        createIssue.mutate(
            { columnId: columns[0].id, title: title.trim(), priority: "medium" },
            {
                onSuccess: (issue) => {
                    setTitle("");
                    setIsCreating(false);
                    openIssue(issue.identifier);
                },
                onError: (reason) => setCreateError(reason instanceof ApiError ? reason.message : "Could not create the issue."),
            },
        );
    }

    const activeFilterCount = [priority, status, assignee, category, cycle].filter(Boolean).length;

    return (
        <div className="flex h-full min-h-0 flex-col bg-primary">
            <ProjectWorkspaceHeader projectId={projectId!} activeView="issues" />
            <main className="mx-auto min-h-0 w-full max-w-6xl flex-1 overflow-y-auto px-4 py-5 lg:px-8">
                <div className="flex flex-col gap-5">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="font-mono text-xs text-fg-brand-primary">{project?.issueKey ?? "Project"}</p>
                            <h1 className="mt-1 text-xl font-semibold text-primary">Issues</h1>
                        </div>
                        <Button
                            size="sm"
                            iconLeading={Plus}
                            onClick={() => {
                                setCreateError(null);
                                setIsCreating(true);
                            }}
                        >
                            New issue
                        </Button>
                    </div>

                    {isCreating && (
                        <div className="flex items-center gap-2 rounded-md border border-secondary bg-secondary_alt p-2">
                            <input
                                autoFocus
                                value={title}
                                onChange={(event) => {
                                    setCreateError(null);
                                    setTitle(event.target.value);
                                }}
                                onKeyDown={(event) => event.key === "Enter" && submitIssue()}
                                placeholder="Issue title"
                                className="min-w-0 flex-1 bg-transparent px-2 text-sm text-primary outline-none"
                            />
                            <Button size="xs" isLoading={createIssue.isPending} onClick={submitIssue}>
                                Create
                            </Button>
                            <Button size="xs" color="tertiary" onClick={() => setIsCreating(false)}>
                                Cancel
                            </Button>
                            {createError && <p role="alert" className="text-xs text-error-primary">{createError}</p>}
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 border-b border-secondary pb-3">
                        <label className="flex h-8 min-w-48 flex-1 items-center gap-2 rounded-md border border-secondary bg-primary px-2.5 text-sm text-tertiary sm:flex-none">
                            <Search aria-hidden="true" className="size-4 shrink-0" />
                            <input
                                value={search}
                                onChange={(event) => updateQuery("q", event.target.value)}
                                placeholder="Search issues"
                                className="min-w-0 flex-1 bg-transparent text-primary outline-none placeholder:text-tertiary"
                            />
                        </label>

                        <div ref={filterRef} className="relative">
                            <ToolbarButton active={isFilterOpen || activeFilterCount > 0} icon={Filter} onClick={() => setIsFilterOpen((open) => !open)} aria-expanded={isFilterOpen}>
                                Filter{activeFilterCount > 0 && ` · ${activeFilterCount}`}
                            </ToolbarButton>
                            {isFilterOpen && (
                                <div className="absolute top-10 left-0 z-20 grid w-[min(20rem,calc(100vw-2rem))] gap-3 rounded-lg border border-secondary bg-primary p-3 shadow-xl sm:grid-cols-2">
                                    <input
                                        autoFocus
                                        value={filterQuery}
                                        onChange={(event) => setFilterQuery(event.target.value)}
                                        placeholder="Search filter values"
                                        aria-label="Search filter values"
                                        className="col-span-full h-8 rounded-md border border-secondary bg-secondary_alt px-2.5 text-xs text-primary outline-none placeholder:text-tertiary focus:border-brand"
                                    />
                                    <FilterSelect label="Status" value={status} onChange={(value) => updateQuery("status", value)} options={filterOptions((columns ?? []).map((item) => ({ value: item.id, label: item.name })), status)} />
                                    <FilterSelect
                                        label="Priority"
                                        value={priority}
                                        onChange={(value) => updateQuery("priority", value)}
                                        options={filterOptions(["high", "medium", "low"].map((value) => ({ value, label: capitalize(value) })), priority)}
                                    />
                                    <FilterSelect label="Assignee" value={assignee} onChange={(value) => updateQuery("assignee", value)} options={filterOptions((members ?? []).map((item) => ({ value: item.id, label: item.name })), assignee)} />
                                    <FilterSelect label="Label" value={category} onChange={(value) => updateQuery("label", value)} options={filterOptions((categories ?? []).map((item) => ({ value: item.id, label: item.name })), category)} />
                                    <FilterSelect label="Cycle" value={cycle} onChange={(value) => updateQuery("cycle", value)} options={filterOptions((cycles ?? []).map((item) => ({ value: item.id, label: item.name })), cycle)} />
                                    <button type="button" onClick={clearFilters} className="self-end text-left text-xs text-tertiary hover:text-primary">
                                        Clear filters
                                    </button>
                                </div>
                            )}
                        </div>

                        <div ref={displayRef} className="relative">
                            <ToolbarButton active={isDisplayOpen || orderBy !== "position" || groupBy !== "none"} icon={SlidersHorizontal} onClick={() => setIsDisplayOpen((open) => !open)} aria-expanded={isDisplayOpen}>
                                Display
                            </ToolbarButton>
                            {isDisplayOpen && (
                                <div className="absolute top-10 right-0 z-20 grid w-56 gap-3 rounded-lg border border-secondary bg-primary p-3 shadow-xl">
                                    <FilterSelect label="Order by" value={orderBy} onChange={(value) => updateQuery("order", value)} options={Object.entries(orderLabels).map(([value, label]) => ({ value, label }))} />
                                    <FilterSelect
                                        label="Group by"
                                        value={groupBy}
                                        onChange={(value) => updateQuery("group", value === "none" ? "" : value)}
                                        options={[
                                            { value: "none", label: "No grouping" },
                                            { value: "status", label: "Status" },
                                            { value: "assignee", label: "Assignee" },
                                            { value: "cycle", label: "Cycle" },
                                        ]}
                                    />
                                </div>
                            )}
                        </div>

                        {(activeFilterCount > 0 || search) && (
                            <button type="button" onClick={clearFilters} className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs text-tertiary hover:bg-primary_hover hover:text-primary">
                                Clear <X aria-hidden="true" className="size-3.5" />
                            </button>
                        )}
                    </div>

                    {activeFilterCount > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {priority && <FilterChip label={`Priority: ${capitalize(priority)}`} onClear={() => updateQuery("priority", "")} />}
                            {status && <FilterChip label={`Status: ${columnById.get(status)?.name ?? "Selected"}`} onClear={() => updateQuery("status", "")} />}
                            {assignee && <FilterChip label={`Assignee: ${memberById.get(assignee)?.name ?? "Selected"}`} onClear={() => updateQuery("assignee", "")} />}
                            {category && <FilterChip label={`Label: ${categoryById.get(category)?.name ?? "Selected"}`} onClear={() => updateQuery("label", "")} />}
                            {cycle && <FilterChip label={`Cycle: ${cycleById.get(cycle)?.name ?? "Selected"}`} onClear={() => updateQuery("cycle", "")} />}
                        </div>
                    )}

                    {isLoading && <LoadingState label="Loading issues..." className="py-3" />}
                    {isError && <ErrorMessage message="Could not load the project issues." />}
                    {!isLoading && !isError && (
                        <div className="overflow-hidden rounded-lg border border-secondary">
                            <div className="hidden grid-cols-[minmax(0,1fr)_8rem_8rem_10rem] gap-3 border-b border-secondary px-3 py-2 text-[11px] font-medium tracking-wide text-tertiary uppercase sm:grid lg:grid-cols-[minmax(0,1fr)_7rem_7rem_9rem_7rem_7rem_4rem]">
                                <span>Issue</span>
                                <span>Status</span>
                                <span>Priority</span>
                                <span>Assignee</span>
                                <span className="hidden lg:block">Label</span>
                                <span className="hidden lg:block">Cycle</span>
                                <span className="hidden text-right lg:block">Est.</span>
                            </div>
                            {groups.map((group) => (
                                <section key={group.key} aria-label={group.label ?? "All issues"}>
                                    {group.label && (
                                        <h2 className="border-b border-secondary bg-secondary_alt">
                                            <button
                                                type="button"
                                                aria-expanded={!collapsedGroups.has(group.key)}
                                                onClick={() => setCollapsedGroups((current) => {
                                                    const next = new Set(current);
                                                    if (next.has(group.key)) next.delete(group.key);
                                                    else next.add(group.key);
                                                    return next;
                                                })}
                                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-secondary hover:bg-primary_hover"
                                            >
                                                <ChevronDown className={`size-3.5 text-fg-quaternary transition-transform ${collapsedGroups.has(group.key) ? "-rotate-90" : ""}`} aria-hidden="true" />
                                                <span>{group.label}</span>
                                                <span className="text-tertiary">{group.issues.length}</span>
                                            </button>
                                        </h2>
                                    )}
                                    {!collapsedGroups.has(group.key) && group.issues.map((issue) => (
                                        <IssueRow
                                            key={issue.id}
                                            issue={issue}
                                            projectId={projectId!}
                                            column={columnById.get(issue.columnId)}
                                            member={issue.assigneeId ? memberById.get(issue.assigneeId) : undefined}
                                            category={issue.categoryId ? categoryById.get(issue.categoryId) : undefined}
                                            cycle={issue.cycleId ? cycleById.get(issue.cycleId) : undefined}
                                            backgroundLocation={location}
                                            selected={selectedIssueId === issue.id}
                                            onSelect={() => setSelectedIssueId(issue.id)}
                                        />
                                    ))}
                                </section>
                            ))}
                            {filteredIssues.length === 0 && (
                                <EmptyState
                                    title={issues?.length ? "No issues match these filters" : "No issues yet"}
                                    description={issues?.length ? "Try clearing a filter or changing your search." : "Create your first issue to start tracking work in this project."}
                                    action={
                                        issues?.length ? (
                                            <Button size="sm" color="secondary" onClick={clearFilters}>
                                                Clear filters
                                            </Button>
                                        ) : (
                                            <Button size="sm" iconLeading={Plus} onClick={() => setIsCreating(true)}>
                                                New issue
                                            </Button>
                                        )
                                    }
                                />
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

function readOrder(value: string | null): OrderBy {
    return value === "number" || value === "priority" || value === "updated" ? value : "position";
}

function readGroup(value: string | null): GroupBy {
    return value === "status" || value === "assignee" || value === "cycle" ? value : "none";
}

function capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function ToolbarButton({ active, icon: Icon, children, ...props }: { active?: boolean; icon: typeof Filter; children: React.ReactNode; onClick: () => void; "aria-expanded": boolean }) {
    return (
        <button
            type="button"
            className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors ${active ? "border-brand/60 bg-secondary_alt text-primary" : "border-secondary text-secondary hover:bg-primary_hover"}`}
            {...props}
        >
            <Icon aria-hidden="true" className="size-3.5" />
            {children}
        </button>
    );
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
    return (
        <label className="grid gap-1 text-xs text-tertiary">
            {label}
            <select value={value} onChange={(event) => onChange(event.target.value)} className="h-8 min-w-0 rounded-md border border-secondary bg-primary px-2 text-xs text-primary outline-none focus:border-brand">
                {label !== "Order by" && label !== "Group by" && <option value="">All</option>}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
    return (
        <button type="button" onClick={onClear} className="inline-flex items-center gap-1 rounded-full border border-secondary bg-secondary_alt px-2 py-1 text-xs text-secondary hover:text-primary">
            {label}
            <X aria-hidden="true" className="size-3" />
        </button>
    );
}

function IssueRow({
    issue,
    projectId,
    column,
    member,
    category,
    cycle,
    backgroundLocation,
    selected,
    onSelect,
}: {
    issue: Issue;
    projectId: string;
    column?: { name: string; color: string | null };
    member?: { name: string; avatarUrl: string | null };
    category?: { name: string; color: string | null };
    cycle?: { name: string };
    backgroundLocation: Location;
    selected: boolean;
    onSelect: () => void;
}) {
    return (
        <Link
            to={`/projects/${projectId}/issues/${issue.identifier}`}
            state={{ backgroundLocation }}
            tabIndex={0}
            data-issue-id={issue.id}
            data-issue-context="true"
            data-project-id={projectId}
            data-issue-identifier={issue.identifier}
            data-issue-title={issue.title}
            onFocus={onSelect}
            className={`grid w-full grid-cols-[minmax(0,1fr)_8rem_8rem_10rem] items-center gap-3 border-b border-secondary px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-primary_hover focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand max-sm:grid-cols-1 max-sm:gap-1.5 lg:grid-cols-[minmax(0,1fr)_7rem_7rem_9rem_7rem_7rem_4rem] ${
                selected ? "bg-secondary" : ""
            }`}
        >
            <span className="flex min-w-0 items-center gap-2">
                <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: column?.color ?? "#71717a" }} />
                <span className="shrink-0 font-mono text-[11px] text-fg-brand-primary">
                    {issue.identifier}
                </span>
                <span className="min-w-0 truncate text-sm text-primary">{issue.title}</span>
                <span className="ml-auto hidden shrink-0 text-[11px] text-tertiary max-sm:block">{column?.name}</span>
            </span>
            <span className="truncate text-xs text-secondary max-sm:hidden">{column?.name ?? "Unknown"}</span>
            <span className="max-sm:hidden"><ImportanceBadge importance={issue.priority} /></span>
            <span className="flex min-w-0 items-center gap-2 text-xs text-tertiary max-sm:hidden">
                {member ? <Avatar size="xs" src={member.avatarUrl ?? undefined} initials={initialsOf(member.name)} /> : <span className="size-6 shrink-0 rounded-full border border-dashed border-secondary" />}
                <span className="truncate">{member?.name ?? "Unassigned"}</span>
            </span>
            <span className="hidden truncate text-xs text-tertiary lg:block">{category?.name ?? "—"}</span>
            <span className="hidden truncate text-xs text-tertiary lg:block">{cycle?.name ?? "—"}</span>
            <span className="hidden text-right font-mono text-xs text-tertiary lg:block">{issue.estimate ?? "—"}</span>
            <span className="hidden truncate text-[11px] text-tertiary max-sm:block">
                {[category?.name, cycle?.name, `${issue.priority} priority`].filter(Boolean).join(" · ")}
            </span>
        </Link>
    );
}

function initialsOf(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]!.toUpperCase())
        .join("");
}
