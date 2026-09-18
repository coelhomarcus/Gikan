import { useEffect, useRef, useState } from "react";
import type { TiptapDocument, UpdateIssueInput } from "@gikan/shared";
import { ArrowLeft, Calendar, CheckCircle, Link2, Plus, Trash2, User, X } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { ErrorMessage } from "@/components/feedback/error-message";
import { ConfirmDialog } from "@/components/overlay/confirm-dialog";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useColumns } from "@/features/board/hooks/use-board";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useProjectMembers } from "@/features/projects/hooks/use-project-members";
import {
    useCreateIssueComment,
    useCreateIssueRelation,
    useCycles,
    useDeleteIssue,
    useDeleteIssueComment,
    useDeleteIssueRelation,
    useIssue,
    useIssueActivity,
    useIssueComments,
    useIssueRelations,
    useIssues,
    useUpdateIssue,
    useUpdateIssueComment,
} from "../hooks/use-issues";
import type { IssueDetail } from "../api";
import { EMPTY_TIPTAP_DOCUMENT, RichTextEditor } from "./rich-text-editor";

interface IssueViewProps {
    identifier?: string;
    projectId?: string;
    mode?: "page" | "peek";
    onClose?: () => void;
}

const activityLabels: Record<string, string> = {
    created: "created this issue",
    status_changed: "changed the status",
    priority_changed: "changed the priority",
    assignee_changed: "changed the assignee",
    category_changed: "changed the category",
    cycle_changed: "changed the cycle",
    estimate_changed: "changed the estimate",
    parent_changed: "changed the parent issue",
    relation_added: "added a relation",
    relation_removed: "removed a relation",
};

export const IssueView = ({ identifier, projectId, mode = "page", onClose }: IssueViewProps) => {
    const navigate = useNavigate();
    const params = useParams<{ projectId: string; issueIdentifier: string }>();
    const resolvedIdentifier = identifier ?? params.issueIdentifier ?? "";
    const resolvedProjectId = projectId ?? params.projectId ?? "";
    const { user } = useAuth();
    const { data: issue, isLoading, isError } = useIssue(resolvedIdentifier);
    const updateIssue = useUpdateIssue(issue?.projectId ?? resolvedProjectId);
    const deleteIssue = useDeleteIssue(issue?.projectId ?? resolvedProjectId);
    const { data: comments } = useIssueComments(issue?.identifier ?? resolvedIdentifier);
    const { data: activity } = useIssueActivity(issue?.identifier ?? resolvedIdentifier);
    const { data: relations } = useIssueRelations(issue?.identifier ?? resolvedIdentifier);
    const { data: projectIssues } = useIssues(issue?.projectId ?? resolvedProjectId);
    const { data: columns } = useColumns(issue?.projectId ?? resolvedProjectId);
    const { data: members } = useProjectMembers(issue?.projectId ?? resolvedProjectId);
    const { data: categories } = useCategories(issue?.projectId ?? resolvedProjectId);
    const { data: cycles } = useCycles(issue?.projectId ?? resolvedProjectId);
    const createComment = useCreateIssueComment(issue?.identifier ?? resolvedIdentifier);
    const deleteComment = useDeleteIssueComment(issue?.identifier ?? resolvedIdentifier);
    const updateComment = useUpdateIssueComment(issue?.identifier ?? resolvedIdentifier);
    const createRelation = useCreateIssueRelation(issue?.identifier ?? resolvedIdentifier);
    const deleteRelation = useDeleteIssueRelation(issue?.identifier ?? resolvedIdentifier);
    const [description, setDescription] = useState<TiptapDocument>(EMPTY_TIPTAP_DOCUMENT);
    const [title, setTitle] = useState("");
    const [comment, setComment] = useState<TiptapDocument>(EMPTY_TIPTAP_DOCUMENT);
    const loadedIssueId = useRef<string | null>(null);
    const titleDirty = useRef(false);
    const descriptionDirty = useRef(false);

    useEffect(() => {
        if (!issue) return;
        if (loadedIssueId.current !== issue.id) {
            loadedIssueId.current = issue.id;
            titleDirty.current = false;
            descriptionDirty.current = false;
            setTitle(issue.title);
            setDescription(issue.descriptionJson ?? EMPTY_TIPTAP_DOCUMENT);
            return;
        }

        if (!titleDirty.current) setTitle(issue.title);
        if (!descriptionDirty.current) setDescription(issue.descriptionJson ?? EMPTY_TIPTAP_DOCUMENT);
    }, [issue]);

    useEffect(() => {
        if (mode !== "peek") return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose?.();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [mode, onClose]);

    if (isLoading) return <div className="p-6 text-sm text-tertiary">Loading issue...</div>;
    if (isError || !issue) return <ErrorMessage message="Could not load this issue." />;

    const save = (input: UpdateIssueInput) => updateIssue.mutate({ identifier: issue.identifier, input });
    const content = (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex items-center justify-between gap-3 border-b border-secondary px-5 py-3">
                <div className="flex min-w-0 items-center gap-2 text-sm text-tertiary">
                    {onClose && <ButtonUtility icon={ArrowLeft} size="sm" color="tertiary" tooltip="Close issue" onClick={onClose} />}
                    <Link to={`/projects/${issue.projectId}`} className="truncate hover:text-primary">
                        {issue.project.name}
                    </Link>
                    <span>/</span>
                    <span className="font-mono text-xs text-fg-brand-primary">{issue.identifier}</span>
                </div>
                <div className="flex items-center gap-1">
                    <ButtonUtility
                        icon={Link2}
                        size="sm"
                        color="tertiary"
                        tooltip="Copy issue link"
                        onClick={() => navigator.clipboard.writeText(window.location.href)}
                    />
                    <ButtonUtility icon={X} size="sm" color="tertiary" tooltip="Close" onClick={onClose ?? (() => navigate(-1))} />
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-8 lg:flex-row lg:items-start lg:gap-10 lg:px-10">
                    <div className="min-w-0 flex-1">
                        <input
                            value={title}
                            onChange={(event) => {
                                titleDirty.current = true;
                                setTitle(event.target.value);
                            }}
                            onBlur={() => {
                                const nextTitle = title.trim();
                                if (!nextTitle) {
                                    setTitle(issue.title);
                                    titleDirty.current = false;
                                    return;
                                }
                                if (nextTitle !== issue.title) {
                                    updateIssue.mutate(
                                        { identifier: issue.identifier, input: { title: nextTitle } },
                                        { onSuccess: () => (titleDirty.current = false) },
                                    );
                                } else {
                                    titleDirty.current = false;
                                }
                            }}
                            className="w-full border-0 bg-transparent text-2xl leading-8 font-semibold text-primary outline-none placeholder:text-tertiary"
                            aria-label="Issue title"
                        />

                        <div className="mt-5 lg:hidden">
                            <IssueProperties issue={issue} projectIssues={projectIssues} columns={columns} members={members} categories={categories} cycles={cycles} save={save} />
                        </div>

                        <section className="mt-6 border-b border-secondary pb-6">
                            <RichTextEditor
                                content={description}
                                onChange={(value) => {
                                    descriptionDirty.current = true;
                                    setDescription(value);
                                }}
                                mentionItems={(members ?? []).map((member) => ({ id: member.id, label: member.username, description: member.name }))}
                                placeholder="Describe the issue..."
                            />
                            <div className="mt-2 flex justify-end">
                                <Button
                                    size="xs"
                                    color="tertiary"
                                    isDisabled={!descriptionDirty.current || JSON.stringify(description) === JSON.stringify(issue.descriptionJson)}
                                    onClick={() =>
                                        updateIssue.mutate(
                                            { identifier: issue.identifier, input: { descriptionJson: description } },
                                            { onSuccess: () => (descriptionDirty.current = false) },
                                        )
                                    }
                                >
                                    Save description
                                </Button>
                            </div>
                        </section>

                        <IssueSubIssues issue={issue} />
                        <IssueRelations
                            projectId={issue.projectId}
                            issueId={issue.id}
                            projectIssues={projectIssues ?? []}
                            relations={relations ?? []}
                            isPending={createRelation.isPending || deleteRelation.isPending}
                            onAdd={(targetIssueIdentifier, type) => createRelation.mutateAsync({ targetIssueIdentifier, type }).then(() => undefined)}
                            onDelete={(relationId) => deleteRelation.mutate(relationId)}
                        />
                        <IssueActivity activity={activity ?? []} />
                        <IssueComments
                            comments={comments ?? []}
                            currentUserId={user?.id}
                            value={comment}
                            onChange={setComment}
                            onSubmit={() => {
                                createComment.mutate({ contentJson: comment }, { onSuccess: () => setComment(EMPTY_TIPTAP_DOCUMENT) });
                            }}
                            onDelete={(commentId) => deleteComment.mutate(commentId)}
                            onEdit={(commentId, contentJson) => updateComment.mutate({ commentId, input: { contentJson } })}
                        />

                        <div className="flex justify-end border-t border-secondary pt-4">
                            <ConfirmDialog
                                trigger={
                                    <Button color="secondary-destructive" size="sm" iconLeading={Trash2}>
                                        Delete issue
                                    </Button>
                                }
                                title="Delete issue"
                                description={`The issue "${issue.title}" will be deleted permanently.`}
                                confirmLabel="Delete issue"
                                isPending={deleteIssue.isPending}
                                onConfirm={() => deleteIssue.mutate(issue.identifier, { onSuccess: onClose ?? (() => navigate(`/projects/${issue.projectId}`)) })}
                            />
                        </div>
                    </div>

                    <aside className="hidden w-64 shrink-0 border-l border-secondary pl-6 lg:block">
                        <IssueProperties issue={issue} projectIssues={projectIssues} columns={columns} members={members} categories={categories} cycles={cycles} save={save} />
                    </aside>
                </div>
            </div>
        </div>
    );

    return mode === "peek" ? (
        <aside aria-label={`Issue ${issue.identifier}`} className="fixed inset-y-0 right-0 z-40 w-full border-l border-secondary bg-primary shadow-2xl sm:w-[min(52rem,calc(100vw-3rem))]">
            {content}
        </aside>
    ) : (
        <main className="h-full min-h-0 bg-primary">{content}</main>
    );
};

function PropertySelect({
    label,
    value,
    options,
    onChange,
    className,
}: {
    label: string;
    value: string;
    options: Array<{ value: string; label: string }>;
    onChange: (value: string) => void;
    className?: string;
}) {
    return (
        <label className={`flex min-w-0 items-center gap-2 rounded-md border border-secondary bg-secondary_alt px-2.5 py-2 text-xs text-tertiary ${className ?? ""}`}>
            <span>{label}</span>
            <select value={value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 bg-transparent text-right font-medium text-primary outline-none">
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

function IssueProperties({
    issue,
    projectIssues,
    columns,
    members,
    categories,
    cycles,
    save,
}: {
    issue: IssueDetail;
    projectIssues?: Array<{ id: string; identifier: string; title: string }>;
    columns?: Array<{ id: string; name: string }>;
    members?: Array<{ id: string; name: string }>;
    categories?: Array<{ id: string; name: string }>;
    cycles?: Array<{ id: string; name: string }>;
    save: (input: UpdateIssueInput) => void;
}) {
    return (
        <div className="flex flex-col gap-2">
            <h2 className="mb-1 text-xs font-medium tracking-wide text-tertiary uppercase">Properties</h2>
            <PropertySelect
                className="w-full"
                value={issue.columnId}
                label="Status"
                options={(columns ?? []).map((column) => ({ value: column.id, label: column.name }))}
                onChange={(value) => save({ columnId: value })}
            />
            <PropertySelect
                className="w-full"
                value={issue.priority}
                label="Priority"
                options={[
                    { value: "low", label: "Low" },
                    { value: "medium", label: "Medium" },
                    { value: "high", label: "High" },
                ]}
                onChange={(value) => save({ priority: value as "low" | "medium" | "high" })}
            />
            <PropertySelect
                className="w-full"
                value={issue.assigneeId ?? ""}
                label="Assignee"
                options={[{ value: "", label: "Unassigned" }, ...(members ?? []).map((member) => ({ value: member.id, label: member.name }))]}
                onChange={(value) => save({ assigneeId: value || null })}
            />
            <PropertySelect
                className="w-full"
                value={issue.categoryId ?? ""}
                label="Label"
                options={[{ value: "", label: "No label" }, ...(categories ?? []).map((category) => ({ value: category.id, label: category.name }))]}
                onChange={(value) => save({ categoryId: value || null })}
            />
            <PropertySelect
                className="w-full"
                value={issue.cycleId ?? ""}
                label="Cycle"
                options={[{ value: "", label: "No cycle" }, ...(cycles ?? []).map((cycle) => ({ value: cycle.id, label: cycle.name }))]}
                onChange={(value) => save({ cycleId: value || null })}
            />
            <PropertySelect
                className="w-full"
                value={String(issue.estimate ?? "")}
                label="Estimate"
                options={[{ value: "", label: "No estimate" }, ...[1, 2, 3, 5, 8].map((value) => ({ value: String(value), label: `${value} points` }))]}
                onChange={(value) => save({ estimate: value ? Number(value) : null })}
            />
            <PropertySelect
                className="w-full"
                value={issue.parent?.id ?? ""}
                label="Parent"
                options={[{ value: "", label: "No parent" }, ...(projectIssues ?? []).filter((candidate) => candidate.id !== issue.id).map((candidate) => ({ value: candidate.id, label: `${candidate.identifier} · ${candidate.title}` }))]}
                onChange={(value) => save({ parentIssueId: value || null })}
            />
        </div>
    );
}

function IssueSubIssues({ issue }: { issue: NonNullable<ReturnType<typeof useIssue>["data"]> }) {
    if (!issue.children?.length) return null;
    return (
        <section className="border-t border-secondary pt-5">
            <SectionTitle
                title={`Sub-issues ${issue.children.filter((child) => child.columnId === issue.columnId).length}/${issue.children.length}`}
                icon={CheckCircle}
            />
            <div className="divide-y divide-secondary rounded-lg border border-secondary">
                {issue.children.map((child) => (
                    <Link
                        key={child.id}
                        to={`/projects/${issue.projectId}/issues/${issue.project.issueKey}-${child.number}`}
                        className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-secondary"
                    >
                        <span className="font-mono text-xs text-fg-brand-primary">
                            {issue.project.issueKey}-{child.number}
                        </span>
                        <span className="text-primary">{child.title}</span>
                    </Link>
                ))}
            </div>
        </section>
    );
}

function IssueRelations({
    projectId,
    issueId,
    projectIssues,
    relations,
    isPending,
    onAdd,
    onDelete,
}: {
    projectId: string;
    issueId: string;
    projectIssues: Array<{ id: string; identifier: string; title: string }>;
    relations: Array<{ id: string; type: string; target: { id: string; number: number; title: string; projectId: string; project: { issueKey: string } } }>;
    isPending: boolean;
    onAdd: (targetIssueIdentifier: string, type: "blocks" | "blocked_by" | "related" | "duplicate") => Promise<void>;
    onDelete: (relationId: string) => void;
}) {
    const [targetIssueIdentifier, setTargetIssueIdentifier] = useState("");
    const [type, setType] = useState<"blocks" | "blocked_by" | "related" | "duplicate">("related");
    const [error, setError] = useState<string | null>(null);

    async function addRelation(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const target = targetIssueIdentifier.trim();
        if (!target) {
            setError("Choose an issue to relate.");
            return;
        }
        if (projectIssues.length > 0 && !projectIssues.some((projectIssue) => projectIssue.identifier.toLowerCase() === target.toLowerCase())) {
            setError("Choose an issue from this project.");
            return;
        }
        setError(null);
        try {
            await onAdd(target, type);
            setTargetIssueIdentifier("");
        } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Could not add the relation.");
        }
    }

    return (
        <section className="border-t border-secondary pt-5">
            <SectionTitle title="Relations" icon={Link2} />
            <div className="divide-y divide-secondary rounded-lg border border-secondary">
                {relations.map((relation) => (
                    <div key={relation.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                        <span className="shrink-0 text-xs text-tertiary">{relation.type.replace("_", " ")}</span>
                        <Link
                            to={`/projects/${relation.target.projectId || projectId}/issues/${relation.target.project.issueKey}-${relation.target.number}`}
                            className="flex min-w-0 flex-1 items-center gap-2 hover:text-fg-brand-primary"
                        >
                            <span className="font-mono text-xs text-fg-brand-primary">
                                {relation.target.project.issueKey}-{relation.target.number}
                            </span>
                            <span className="truncate text-primary">{relation.target.title}</span>
                        </Link>
                        <ButtonUtility icon={Trash2} size="xs" color="tertiary" className="text-error-primary hover:text-error-primary_hover" tooltip="Remove relation" onClick={() => onDelete(relation.id)} isDisabled={isPending} />
                    </div>
                ))}
                <form className="flex flex-col gap-2 p-2 sm:flex-row" onSubmit={addRelation}>
                    <input
                        list="issue-relation-options"
                        value={targetIssueIdentifier}
                        onChange={(event) => setTargetIssueIdentifier(event.target.value)}
                        placeholder="Issue identifier"
                        aria-label="Issue to relate"
                        className="h-8 min-w-0 flex-1 rounded-md border border-secondary bg-primary px-2 text-xs text-primary outline-none placeholder:text-tertiary focus:border-brand"
                    />
                    <datalist id="issue-relation-options">
                        {projectIssues.filter((projectIssue) => projectIssue.id !== issueId).map((projectIssue) => <option key={projectIssue.id} value={projectIssue.identifier}>{projectIssue.title}</option>)}
                    </datalist>
                    <select value={type} onChange={(event) => setType(event.target.value as typeof type)} aria-label="Relation type" className="h-8 rounded-md border border-secondary bg-primary px-2 text-xs text-primary outline-none focus:border-brand">
                        <option value="related">Related to</option>
                        <option value="blocks">Blocks</option>
                        <option value="blocked_by">Blocked by</option>
                        <option value="duplicate">Duplicate of</option>
                    </select>
                    <Button type="submit" size="xs" iconLeading={Plus} isLoading={isPending}>
                        Add
                    </Button>
                </form>
            </div>
            {error && <p role="alert" className="mt-2 text-xs text-error-primary">{error}</p>}
        </section>
    );
}

function IssueActivity({ activity }: { activity: Array<{ id: string; type: string; createdAt: string; actor: { name: string } }> }) {
    if (!activity.length) return null;
    return (
        <section className="border-t border-secondary pt-5">
            <SectionTitle title="Activity" icon={Calendar} />
            <div className="flex flex-col gap-3">
                {activity.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-2 text-sm text-tertiary">
                        <span className="font-medium text-secondary">{entry.actor.name}</span>
                        <span>{activityLabels[entry.type] ?? entry.type}</span>
                        <span className="ml-auto text-xs">{formatDistanceToNow(entry.createdAt)}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}

function IssueComments({
    comments,
    currentUserId,
    value,
    onChange,
    onSubmit,
    onDelete,
    onEdit,
}: {
    comments: Array<{ id: string; contentJson: TiptapDocument; authorId: string; author: { name: string; avatarUrl: string | null }; createdAt: string }>;
    currentUserId?: string;
    value: TiptapDocument;
    onChange: (value: TiptapDocument) => void;
    onSubmit: () => void;
    onDelete: (id: string) => void;
    onEdit: (id: string, contentJson: TiptapDocument) => void;
}) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState<TiptapDocument>(EMPTY_TIPTAP_DOCUMENT);
    return (
        <section className="border-t border-secondary pt-5">
            <SectionTitle title="Comments" icon={User} />
            <div className="flex flex-col gap-4">
                {comments.map((entry) => (
                    <article key={entry.id} className="rounded-lg border border-secondary p-4">
                        <div className="mb-2 flex items-center justify-between gap-3 text-xs text-tertiary">
                            <span className="font-medium text-secondary">{entry.author.name}</span>
                            <span>{formatDistanceToNow(entry.createdAt)}</span>
                        </div>
                        {editingId === entry.id ? (
                            <>
                                <RichTextEditor content={editingContent} onChange={setEditingContent} />
                                <div className="mt-2 flex justify-end gap-2">
                                    <Button size="xs" color="tertiary" onClick={() => setEditingId(null)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        size="xs"
                                        onClick={() => {
                                            onEdit(entry.id, editingContent);
                                            setEditingId(null);
                                        }}
                                    >
                                        Save
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <RichTextEditor content={entry.contentJson} editable={false} />
                        )}
                        {entry.authorId === currentUserId && editingId !== entry.id && (
                            <div className="mt-2 flex gap-3">
                                <button
                                    type="button"
                                    className="text-xs text-secondary hover:text-primary"
                                    onClick={() => {
                                        setEditingId(entry.id);
                                        setEditingContent(entry.contentJson);
                                    }}
                                >
                                    Edit
                                </button>
                                <button type="button" className="text-xs text-error-primary" onClick={() => onDelete(entry.id)}>
                                    Delete
                                </button>
                            </div>
                        )}
                    </article>
                ))}
                <div className="rounded-lg border border-secondary">
                    <RichTextEditor content={value} onChange={onChange} onSubmitShortcut={onSubmit} placeholder="Leave a comment..." />
                    <div className="flex justify-end border-t border-secondary p-2">
                        <Button size="sm" iconLeading={Plus} isDisabled={!value.content?.length} onClick={onSubmit}>
                            Comment
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}

function SectionTitle({ title, icon: Icon }: { title: string; icon: typeof CheckCircle }) {
    return (
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
            <Icon className="size-4 text-fg-quaternary" />
            {title}
        </h2>
    );
}

function formatDistanceToNow(value: string) {
    const minutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000));
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
}
