import { useEffect, useRef, useState } from "react";
import type { TiptapDocument, UpdateIssueInput } from "@gikan/shared";
import { ArrowLeft, Calendar, CheckCircle, ExternalLink, Link2, Plus, Trash2, User, X } from "lucide-react";
import { Link, useBeforeUnload, useNavigate, useParams } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { ComboBox, ComboBoxItem } from "@/components/base/select/combobox";
import { Select } from "@/components/base/select/select";
import { ErrorMessage } from "@/components/feedback/error-message";
import { LoadingState } from "@/components/feedback/loading-state";
import { ConfirmDialog } from "@/components/overlay/confirm-dialog";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useColumns } from "@/features/board/hooks/use-board";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useProjectMembers } from "@/features/projects/hooks/use-project-members";
import { ApiError } from "@/lib/api-client";
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
    const [titleSaveError, setTitleSaveError] = useState<string | null>(null);
    const [descriptionSaveError, setDescriptionSaveError] = useState<string | null>(null);
    const [propertySaveError, setPropertySaveError] = useState<string | null>(null);
    const [commentSaveError, setCommentSaveError] = useState<string | null>(null);
    const loadedIssueId = useRef<string | null>(null);
    const titleDirty = useRef(false);
    const descriptionDirty = useRef(false);
    const titleVersion = useRef(0);
    const descriptionVersion = useRef(0);
    const titleRef = useRef<HTMLTextAreaElement>(null);
    const peekRef = useRef<HTMLElement>(null);

    useBeforeUnload((event) => {
        if (!titleDirty.current && !descriptionDirty.current && !comment.content?.length) return;
        event.preventDefault();
        event.returnValue = "";
    });

    useEffect(() => {
        if (!issue) return;
        if (loadedIssueId.current !== issue.id) {
            loadedIssueId.current = issue.id;
            titleDirty.current = false;
            descriptionDirty.current = false;
            titleVersion.current = 0;
            descriptionVersion.current = 0;
            setTitle(issue.title);
            setDescription(issue.descriptionJson ?? EMPTY_TIPTAP_DOCUMENT);
            return;
        }

        if (!titleDirty.current) setTitle(issue.title);
        if (!descriptionDirty.current) setDescription(issue.descriptionJson ?? EMPTY_TIPTAP_DOCUMENT);
    }, [issue]);

    useEffect(() => {
        const titleElement = titleRef.current;
        if (!titleElement) return;
        titleElement.style.height = "auto";
        titleElement.style.height = `${titleElement.scrollHeight}px`;
    }, [title]);

    useEffect(() => {
        if (mode !== "peek") return;
        const previouslyFocused = document.activeElement as HTMLElement | null;
        const focusFrame = window.requestAnimationFrame(() => peekRef.current?.focus());
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose?.();
                return;
            }
            if (event.key !== "Tab" || !peekRef.current) return;
            const focusable = Array.from(peekRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"));
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.cancelAnimationFrame(focusFrame);
            window.removeEventListener("keydown", handleKeyDown);
            previouslyFocused?.focus();
        };
    }, [mode, onClose]);

    if (isLoading) {
        const state = <LoadingState label="Loading issue..." className="p-6" />;
        return mode === "peek" ? <IssuePeekState onClose={onClose}>{state}</IssuePeekState> : state;
    }
    if (isError || !issue) {
        const state = <ErrorMessage message="Could not load this issue." />;
        return mode === "peek" ? <IssuePeekState onClose={onClose}>{state}</IssuePeekState> : state;
    }

    const save = (input: UpdateIssueInput) => {
        setPropertySaveError(null);
        updateIssue.mutate(
            { identifier: issue.identifier, input },
            { onError: (reason) => setPropertySaveError(errorMessage(reason)) },
        );
    };
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
                    {mode === "peek" && (
                        <ButtonUtility
                            icon={ExternalLink}
                            size="sm"
                            color="tertiary"
                            tooltip="Open full page"
                            onClick={() => navigate(`/projects/${issue.projectId}/issues/${issue.identifier}`, { replace: true })}
                        />
                    )}
                    <ButtonUtility icon={X} size="sm" color="tertiary" tooltip="Close" onClick={onClose ?? (() => navigate(`/projects/${issue.projectId}/issues`))} />
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-8 lg:flex-row lg:items-start lg:gap-10 lg:px-10">
                    <div className="min-w-0 flex-1">
                        <textarea
                            ref={titleRef}
                            rows={1}
                            value={title}
                            onChange={(event) => {
                                titleDirty.current = true;
                                titleVersion.current += 1;
                                setTitleSaveError(null);
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
                                    const saveVersion = titleVersion.current;
                                    updateIssue.mutate(
                                        { identifier: issue.identifier, input: { title: nextTitle } },
                                        {
                                            onSuccess: () => {
                                                if (titleVersion.current === saveVersion) titleDirty.current = false;
                                            },
                                            onError: (reason) => setTitleSaveError(errorMessage(reason)),
                                        },
                                    );
                                } else {
                                    titleDirty.current = false;
                                }
                            }}
                            className="min-h-8 w-full resize-none overflow-hidden border-0 bg-transparent text-2xl leading-8 font-semibold text-primary outline-none placeholder:text-tertiary"
                            aria-label="Issue title"
                        />
                        {titleSaveError && <p role="alert" className="mt-1 text-xs text-error-primary">{titleSaveError}</p>}

                        <div className="mt-5 lg:hidden">
                            <IssueProperties issue={issue} projectIssues={projectIssues} columns={columns} members={members} categories={categories} cycles={cycles} save={save} error={propertySaveError} isPending={updateIssue.isPending} />
                        </div>

                        <section className="mt-6 border-b border-secondary pb-6">
                            <RichTextEditor
                                content={description}
                                onChange={(value) => {
                                    descriptionDirty.current = true;
                                    descriptionVersion.current += 1;
                                    setDescriptionSaveError(null);
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
                                        (() => {
                                            const saveVersion = descriptionVersion.current;
                                            updateIssue.mutate(
                                                { identifier: issue.identifier, input: { descriptionJson: description } },
                                                {
                                                    onSuccess: () => {
                                                        if (descriptionVersion.current === saveVersion) descriptionDirty.current = false;
                                                    },
                                                    onError: (reason) => setDescriptionSaveError(errorMessage(reason)),
                                                },
                                            );
                                        })()
                                    }
                                >
                                    Save description
                                </Button>
                            </div>
                            {descriptionSaveError && <p role="alert" className="mt-2 text-right text-xs text-error-primary">{descriptionSaveError}</p>}
                        </section>

                        <IssueSubIssues issue={issue} columns={columns ?? []} />
                        <IssueRelations
                            projectId={issue.projectId}
                            issueId={issue.id}
                            projectIssues={projectIssues ?? []}
                            relations={relations ?? []}
                            isPending={createRelation.isPending || deleteRelation.isPending}
                            onAdd={(targetIssueIdentifier, type) => createRelation.mutateAsync({ targetIssueIdentifier, type }).then(() => undefined)}
                            onDelete={(relationId) => deleteRelation.mutate(relationId)}
                        />
                        <IssueActivity activity={activity ?? []} columns={columns ?? []} members={members ?? []} categories={categories ?? []} cycles={cycles ?? []} projectIssues={projectIssues ?? []} />
                        <IssueComments
                            comments={comments ?? []}
                            currentUserId={user?.id}
                            value={comment}
                            onChange={setComment}
                            isSubmitting={createComment.isPending || updateComment.isPending || deleteComment.isPending}
                            error={commentSaveError}
                            onSubmit={async () => {
                                setCommentSaveError(null);
                                try {
                                    await createComment.mutateAsync({ contentJson: comment });
                                    setComment(EMPTY_TIPTAP_DOCUMENT);
                                } catch (reason) {
                                    setCommentSaveError(errorMessage(reason, "Could not add the comment."));
                                }
                            }}
                            onDelete={async (commentId) => {
                                setCommentSaveError(null);
                                try {
                                    await deleteComment.mutateAsync(commentId);
                                } catch (reason) {
                                    setCommentSaveError(errorMessage(reason, "Could not delete the comment."));
                                    throw reason;
                                }
                            }}
                            onEdit={async (commentId, contentJson) => {
                                setCommentSaveError(null);
                                try {
                                    await updateComment.mutateAsync({ commentId, input: { contentJson } });
                                } catch (reason) {
                                    setCommentSaveError(errorMessage(reason, "Could not update the comment."));
                                    throw reason;
                                }
                            }}
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
                        <IssueProperties issue={issue} projectIssues={projectIssues} columns={columns} members={members} categories={categories} cycles={cycles} save={save} error={propertySaveError} isPending={updateIssue.isPending} />
                    </aside>
                </div>
            </div>
        </div>
    );

    return mode === "peek" ? (
        <>
            <div aria-hidden="true" className="fixed inset-0 z-30 bg-black/40" onMouseDown={() => onClose?.()} />
            <aside ref={peekRef} tabIndex={-1} aria-label={`Issue ${issue.identifier}`} aria-modal="true" className="fixed inset-y-0 right-0 z-40 w-full border-l border-secondary bg-primary shadow-2xl outline-none sm:w-[min(52rem,calc(100vw-3rem))]">
                {content}
            </aside>
        </>
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
    isDisabled,
    searchable,
}: {
    label: string;
    value: string;
    options: Array<{ value: string; label: string }>;
    onChange: (value: string) => void;
    className?: string;
    isDisabled?: boolean;
    searchable?: boolean;
}) {
    const items = options.map((option) => ({ id: option.value, label: option.label }));
    if (searchable) {
        return (
            <ComboBox
                className={`w-full ${className ?? ""}`}
                items={items}
                selectedKey={value || null}
                onSelectionChange={(next) => onChange(String(next ?? ""))}
                isDisabled={isDisabled}
                label={label}
                placeholder={options.find((option) => option.value === value)?.label ?? "Select"}
                size="sm"
            >
                {(item) => <ComboBoxItem item={item}>{item.label}</ComboBoxItem>}
            </ComboBox>
        );
    }

    return (
        <Select
            className={`w-full ${className ?? ""}`}
            items={items}
            selectedKey={value}
            onSelectionChange={(next) => onChange(String(next ?? ""))}
            isDisabled={isDisabled}
            label={label}
            size="sm"
        >
            {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
        </Select>
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
    error,
    isPending,
}: {
    issue: IssueDetail;
    projectIssues?: Array<{ id: string; identifier: string; title: string }>;
    columns?: Array<{ id: string; name: string }>;
    members?: Array<{ id: string; name: string }>;
    categories?: Array<{ id: string; name: string }>;
    cycles?: Array<{ id: string; name: string }>;
    save: (input: UpdateIssueInput) => void;
    error?: string | null;
    isPending: boolean;
}) {
    return (
        <div className="flex flex-col gap-2">
            <h2 className="mb-1 text-xs font-medium tracking-wide text-tertiary uppercase">Properties</h2>
            {error && <p role="alert" className="text-xs text-error-primary">{error}</p>}
            {isPending && <p className="text-xs text-tertiary">Saving property...</p>}
            <PropertySelect
                className="w-full"
                value={issue.columnId}
                label="Status"
                options={(columns ?? []).map((column) => ({ value: column.id, label: column.name }))}
                isDisabled={isPending}
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
                isDisabled={isPending}
                onChange={(value) => save({ priority: value as "low" | "medium" | "high" })}
            />
            <PropertySelect
                className="w-full"
                value={issue.assigneeId ?? ""}
                label="Assignee"
                options={[{ value: "", label: "Unassigned" }, ...(members ?? []).map((member) => ({ value: member.id, label: member.name }))]}
                searchable
                isDisabled={isPending}
                onChange={(value) => save({ assigneeId: value || null })}
            />
            <PropertySelect
                className="w-full"
                value={issue.categoryId ?? ""}
                label="Label"
                options={[{ value: "", label: "No label" }, ...(categories ?? []).map((category) => ({ value: category.id, label: category.name }))]}
                searchable
                isDisabled={isPending}
                onChange={(value) => save({ categoryId: value || null })}
            />
            <PropertySelect
                className="w-full"
                value={issue.cycleId ?? ""}
                label="Cycle"
                options={[{ value: "", label: "No cycle" }, ...(cycles ?? []).map((cycle) => ({ value: cycle.id, label: cycle.name }))]}
                searchable
                isDisabled={isPending}
                onChange={(value) => save({ cycleId: value || null })}
            />
            <PropertySelect
                className="w-full"
                value={String(issue.estimate ?? "")}
                label="Estimate"
                options={[{ value: "", label: "No estimate" }, ...[1, 2, 3, 5, 8].map((value) => ({ value: String(value), label: `${value} points` }))]}
                isDisabled={isPending}
                onChange={(value) => save({ estimate: value ? Number(value) : null })}
            />
            <PropertySelect
                className="w-full"
                value={issue.parent?.id ?? ""}
                label="Parent"
                options={[{ value: "", label: "No parent" }, ...(projectIssues ?? []).filter((candidate) => candidate.id !== issue.id).map((candidate) => ({ value: candidate.id, label: `${candidate.identifier} · ${candidate.title}` }))]}
                searchable
                isDisabled={isPending}
                onChange={(value) => save({ parentIssueId: value || null })}
            />
            <div className="mt-2 flex flex-col gap-2 border-t border-secondary pt-3 text-xs">
                <ReadOnlyProperty label="Project" value={`${issue.project.name} · ${issue.project.issueKey}`} />
                <ReadOnlyProperty label="Created by" value={issue.createdBy.name} />
                <ReadOnlyProperty label="Created" value={formatDate(issue.createdAt)} />
                <ReadOnlyProperty label="Updated" value={formatDate(issue.updatedAt)} />
            </div>
        </div>
    );
}

function ReadOnlyProperty({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-3">
            <span className="text-tertiary">{label}</span>
            <span className="min-w-0 truncate text-right text-secondary">{value}</span>
        </div>
    );
}

function IssueSubIssues({ issue, columns }: { issue: NonNullable<ReturnType<typeof useIssue>["data"]>; columns: Array<{ id: string; name: string }> }) {
    if (!issue.children?.length) return null;
    const statusCounts = issue.children.reduce((counts, child) => {
        const status = columns.find((column) => column.id === child.columnId)?.name ?? "Unknown status";
        counts.set(status, (counts.get(status) ?? 0) + 1);
        return counts;
    }, new Map<string, number>());
    return (
        <section className="border-t border-secondary pt-5">
            <SectionTitle title={`Sub-issues · ${issue.children.length}`} icon={CheckCircle} />
            <div className="mb-3 flex flex-wrap gap-1.5">
                {[...statusCounts.entries()].map(([status, count]) => (
                    <span key={status} className="rounded-full border border-secondary bg-secondary_alt px-2 py-1 text-[11px] text-tertiary">
                        {status} · {count}
                    </span>
                ))}
            </div>
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
                    <ComboBox
                        className="min-w-0 flex-1 sm:min-w-48"
                        items={projectIssues.filter((projectIssue) => projectIssue.id !== issueId).map((projectIssue) => ({ id: projectIssue.identifier, label: `${projectIssue.identifier} · ${projectIssue.title}` }))}
                        selectedKey={targetIssueIdentifier || null}
                        onSelectionChange={(next) => setTargetIssueIdentifier(String(next ?? ""))}
                        placeholder="Issue identifier"
                        size="sm"
                    >
                        {(item) => <ComboBoxItem item={item}>{item.label}</ComboBoxItem>}
                    </ComboBox>
                    <Select
                        className="sm:w-36"
                        aria-label="Relation type"
                        items={[
                            { id: "related", label: "Related to" },
                            { id: "blocks", label: "Blocks" },
                            { id: "blocked_by", label: "Blocked by" },
                            { id: "duplicate", label: "Duplicate of" },
                        ]}
                        selectedKey={type}
                        onSelectionChange={(next) => setType((next ?? "related") as typeof type)}
                        size="sm"
                    >
                        {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                    </Select>
                    <Button type="submit" size="xs" iconLeading={Plus} isLoading={isPending}>
                        Add
                    </Button>
                </form>
            </div>
            {error && <p role="alert" className="mt-2 text-xs text-error-primary">{error}</p>}
        </section>
    );
}

function IssueActivity({ activity, columns, members, categories, cycles, projectIssues }: {
    activity: Array<{ id: string; type: string; createdAt: string; actor: { name: string }; payload: Record<string, unknown> }>;
    columns: Array<{ id: string; name: string }>;
    members: Array<{ id: string; name: string }>;
    categories: Array<{ id: string; name: string }>;
    cycles: Array<{ id: string; name: string }>;
    projectIssues: Array<{ id: string; identifier: string; title: string }>;
}) {
    if (!activity.length) return null;
    return (
        <section className="border-t border-secondary pt-5">
            <SectionTitle title="Activity" icon={Calendar} />
            <div className="flex flex-col gap-3">
                {activity.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-2 text-sm text-tertiary">
                        <span className="font-medium text-secondary">{entry.actor.name}</span>
                        <span>{activityLabels[entry.type] ?? entry.type}{formatActivityChange(entry.payload, { columns, members, categories, cycles, projectIssues })}</span>
                        <span className="ml-auto text-xs">{formatDistanceToNow(entry.createdAt)}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}

function formatActivityChange(payload: Record<string, unknown>, lookups: {
    columns: Array<{ id: string; name: string }>;
    members: Array<{ id: string; name: string }>;
    categories: Array<{ id: string; name: string }>;
    cycles: Array<{ id: string; name: string }>;
    projectIssues: Array<{ id: string; identifier: string; title: string }>;
}) {
    if (!("from" in payload) && !("to" in payload)) return "";
    const field = String(payload.field ?? "");
    const resolve = (value: unknown) => {
        if (value === null || value === undefined || value === "") return "None";
        const options = field === "columnId" ? lookups.columns : field === "assigneeId" ? lookups.members : field === "categoryId" ? lookups.categories : field === "cycleId" ? lookups.cycles : field === "parentIssueId" ? lookups.projectIssues : [];
        const match = options.find((option) => option.id === value);
        if (match && "identifier" in match) return match.identifier;
        if (match) return match.name;
        return String(value);
    };
    return ` · ${resolve(payload.from)} → ${resolve(payload.to)}`;
}

function IssueComments({
    comments,
    currentUserId,
    value,
    onChange,
    isSubmitting,
    error,
    onSubmit,
    onDelete,
    onEdit,
}: {
    comments: Array<{ id: string; contentJson: TiptapDocument; authorId: string; author: { name: string; avatarUrl: string | null }; createdAt: string }>;
    currentUserId?: string;
    value: TiptapDocument;
    onChange: (value: TiptapDocument) => void;
    isSubmitting: boolean;
    error?: string | null;
    onSubmit: () => void | Promise<void>;
    onDelete: (id: string) => void | Promise<void>;
    onEdit: (id: string, contentJson: TiptapDocument) => void | Promise<void>;
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
                                        isLoading={isSubmitting}
                                        onClick={async () => {
                                            try {
                                                await onEdit(entry.id, editingContent);
                                                setEditingId(null);
                                            } catch {
                                                // The parent displays the mutation error and preserves the editor.
                                            }
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
                                <button
                                    type="button"
                                    disabled={isSubmitting}
                                    className="text-xs text-error-primary disabled:cursor-not-allowed disabled:opacity-50"
                                    onClick={async () => {
                                        try {
                                            await onDelete(entry.id);
                                        } catch {
                                            // The parent displays the mutation error.
                                        }
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                    </article>
                ))}
                <div className="rounded-lg border border-secondary">
                    <RichTextEditor content={value} onChange={onChange} onSubmitShortcut={onSubmit} placeholder="Leave a comment..." />
                    <div className="flex justify-end border-t border-secondary p-2">
                        <Button size="sm" iconLeading={Plus} isDisabled={!value.content?.length || isSubmitting} isLoading={isSubmitting} onClick={onSubmit}>
                            Comment
                        </Button>
                    </div>
                </div>
            </div>
            {error && <p role="alert" className="mt-2 text-xs text-error-primary">{error}</p>}
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

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function IssuePeekState({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
    return (
        <>
            <div aria-hidden="true" className="fixed inset-0 z-30 bg-black/40" onMouseDown={() => onClose?.()} />
            <aside role="dialog" aria-modal="true" aria-label="Issue panel" className="fixed inset-y-0 right-0 z-40 flex w-full items-start border-l border-secondary bg-primary shadow-2xl sm:w-[min(52rem,calc(100vw-3rem))]">
                <div className="w-full">{children}</div>
            </aside>
        </>
    );
}

function errorMessage(reason: unknown, fallback = "Could not save the issue.") {
    if (reason instanceof ApiError) return reason.message;
    if (reason instanceof Error) return reason.message;
    return fallback;
}
