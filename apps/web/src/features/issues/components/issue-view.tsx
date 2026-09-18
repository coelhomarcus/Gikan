import { useEffect, useState } from "react";
import type { TiptapDocument } from "@gikan/shared";
import { ArrowLeft, Calendar, CheckCircle, Link01, Plus, Trash01, User01, X } from "@untitledui/icons";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { ErrorMessage } from "@/components/feedback/error-message";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useColumns } from "@/features/board/hooks/use-board";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useProjectMembers } from "@/features/projects/hooks/use-project-members";
import { cx } from "@/utils/cx";
import {
    useCreateIssueComment,
    useCycles,
    useDeleteIssue,
    useDeleteIssueComment,
    useIssue,
    useIssueActivity,
    useIssueComments,
    useIssueRelations,
    useUpdateIssue,
    useUpdateIssueComment,
} from "../hooks/use-issues";
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
    const { data: columns } = useColumns(issue?.projectId ?? resolvedProjectId);
    const { data: members } = useProjectMembers(issue?.projectId ?? resolvedProjectId);
    const { data: categories } = useCategories(issue?.projectId ?? resolvedProjectId);
    const { data: cycles } = useCycles(issue?.projectId ?? resolvedProjectId);
    const createComment = useCreateIssueComment(issue?.identifier ?? resolvedIdentifier);
    const deleteComment = useDeleteIssueComment(issue?.identifier ?? resolvedIdentifier);
    const updateComment = useUpdateIssueComment(issue?.identifier ?? resolvedIdentifier);
    const [description, setDescription] = useState<TiptapDocument>(EMPTY_TIPTAP_DOCUMENT);
    const [title, setTitle] = useState("");
    const [comment, setComment] = useState<TiptapDocument>(EMPTY_TIPTAP_DOCUMENT);

    useEffect(() => {
        if (!issue) return;
        setTitle(issue.title);
        setDescription(issue.descriptionJson ?? EMPTY_TIPTAP_DOCUMENT);
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

    const save = (input: Parameters<typeof updateIssue.mutate>[0]["input"]) => updateIssue.mutate({ identifier: issue.identifier, input });
    const content = (
        <div className={cx("flex min-h-0 flex-col", mode === "peek" ? "h-full" : "min-h-dvh")}>
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
                        icon={Link01}
                        size="sm"
                        color="tertiary"
                        tooltip="Copy issue link"
                        onClick={() => navigator.clipboard.writeText(window.location.href)}
                    />
                    <ButtonUtility icon={X} size="sm" color="tertiary" tooltip="Close" onClick={onClose ?? (() => navigate(-1))} />
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-8 lg:px-10">
                    <input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        onBlur={() => title.trim() && title !== issue.title && save({ title: title.trim() })}
                        className="w-full border-0 bg-transparent text-display-xs font-semibold text-primary outline-none placeholder:text-tertiary"
                        aria-label="Issue title"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                        <PropertySelect
                            value={issue.columnId}
                            label="Status"
                            options={(columns ?? []).map((column) => ({ value: column.id, label: column.name }))}
                            onChange={(value) => save({ columnId: value })}
                        />
                        <PropertySelect
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
                            value={issue.assigneeId ?? ""}
                            label="Assignee"
                            options={[{ value: "", label: "Unassigned" }, ...(members ?? []).map((member) => ({ value: member.id, label: member.name }))]}
                            onChange={(value) => save({ assigneeId: value || null })}
                        />
                        <PropertySelect
                            value={issue.categoryId ?? ""}
                            label="Label"
                            options={[
                                { value: "", label: "No label" },
                                ...(categories ?? []).map((category) => ({ value: category.id, label: category.name })),
                            ]}
                            onChange={(value) => save({ categoryId: value || null })}
                        />
                        <PropertySelect
                            value={issue.cycleId ?? ""}
                            label="Cycle"
                            options={[{ value: "", label: "No cycle" }, ...(cycles ?? []).map((cycle) => ({ value: cycle.id, label: cycle.name }))]}
                            onChange={(value) => save({ cycleId: value || null })}
                        />
                        <PropertySelect
                            value={String(issue.estimate ?? "")}
                            label="Estimate"
                            options={[
                                { value: "", label: "No estimate" },
                                ...[1, 2, 3, 5, 8].map((value) => ({ value: String(value), label: `${value} points` })),
                            ]}
                            onChange={(value) => save({ estimate: value ? Number(value) : null })}
                        />
                    </div>

                    <section className="border-b border-secondary pb-6">
                        <RichTextEditor
                            content={description}
                            onChange={setDescription}
                            mentionItems={(members ?? []).map((member) => ({ id: member.id, label: member.username, description: member.name }))}
                            placeholder="Describe the issue..."
                        />
                        <div className="mt-2 flex justify-end">
                            <Button
                                size="xs"
                                color="tertiary"
                                isDisabled={JSON.stringify(description) === JSON.stringify(issue.descriptionJson)}
                                onClick={() => save({ descriptionJson: description })}
                            >
                                Save description
                            </Button>
                        </div>
                    </section>

                    <IssueSubIssues issue={issue} />
                    <IssueRelations relations={relations ?? []} />
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
                        <Button
                            color="secondary-destructive"
                            size="sm"
                            iconLeading={Trash01}
                            onClick={() => deleteIssue.mutate(issue.identifier, { onSuccess: onClose ?? (() => navigate(`/projects/${issue.projectId}`)) })}
                        >
                            Delete issue
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );

    return mode === "peek" ? (
        <aside className="fixed inset-y-0 right-0 z-40 w-full border-l border-secondary bg-primary shadow-2xl sm:w-[min(48rem,calc(100vw-3rem))]">
            {content}
        </aside>
    ) : (
        <main className="min-h-dvh bg-primary">{content}</main>
    );
};

function PropertySelect({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string;
    options: Array<{ value: string; label: string }>;
    onChange: (value: string) => void;
}) {
    return (
        <label className="inline-flex items-center gap-1.5 rounded-md border border-secondary bg-secondary_alt px-2 py-1 text-xs text-tertiary">
            <span>{label}</span>
            <select value={value} onChange={(event) => onChange(event.target.value)} className="max-w-32 bg-transparent font-medium text-primary outline-none">
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
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
    relations,
}: {
    relations: Array<{ id: string; type: string; target: { number: number; title: string; project: { issueKey: string } } }>;
}) {
    if (!relations.length) return null;
    return (
        <section className="border-t border-secondary pt-5">
            <SectionTitle title="Relations" icon={Link01} />
            <div className="divide-y divide-secondary rounded-lg border border-secondary">
                {relations.map((relation) => (
                    <div key={relation.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                        <span className="text-tertiary">{relation.type.replace("_", " ")}</span>
                        <span className="font-mono text-xs text-fg-brand-primary">
                            {relation.target.project.issueKey}-{relation.target.number}
                        </span>
                        <span className="text-primary">{relation.target.title}</span>
                    </div>
                ))}
            </div>
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
            <SectionTitle title="Comments" icon={User01} />
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
                    <RichTextEditor content={value} onChange={onChange} placeholder="Leave a comment..." />
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
