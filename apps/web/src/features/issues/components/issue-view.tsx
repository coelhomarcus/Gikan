import { useEffect, useRef, useState } from "react";
import type { TiptapDocument, UpdateIssueInput } from "@gikan/shared";
import { ArrowLeft, ArrowRight, Calendar, CheckCircle, ExternalLink, Link2, Plus, Trash2, User, X } from "lucide-react";
import { Link, useBeforeUnload, useNavigate, useParams } from "react-router";
import { AssigneeOutline, CyclesOutline, EstimateOutline, HistoryOutline, LabelsOutline, MoreHorizontalOutline, ParentOutline, PriorityOutline, StateOutline } from "@makeplane/propel/icons";
import { Popover } from "@base-ui/react/popover";
import { IssueAvatar, PriorityIcon, StateIcon } from "@/features/board/components/issue-property-icons";
import { cx } from "@/utils/cx";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Skeleton } from "@/components/base/feedback/skeleton";
import { Sheet } from "@/components/base/sheet/sheet";
import { ComboBox, ComboBoxItem } from "@/components/base/select/combobox";
import { Select } from "@/components/base/select/select";
import { ErrorMessage } from "@/components/feedback/error-message";
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
    const [descriptionEditing, setDescriptionEditing] = useState(false);
    const [relationsOpen, setRelationsOpen] = useState(false);
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
    const peekRef = useRef<HTMLDivElement>(null);

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
            setDescriptionEditing(false);
            setRelationsOpen(false);
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
        const card = document.querySelector<HTMLElement>(`[data-issue-identifier="${resolvedIdentifier}"]`);
        card?.setAttribute("data-peek-selected", "true");
        return () => card?.removeAttribute("data-peek-selected");
    }, [mode, resolvedIdentifier]);

    if (isLoading) {
        const state = <IssueLoadingSkeleton mode={mode} />;
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
        <div className={cx("flex h-full min-h-0 flex-col", mode === "peek" && "plane-issue-peek")}>
            <div className={cx("issue-view-header flex items-center justify-between gap-3 px-4 py-3", mode === "page" && "border-b border-subtle")}>
                <div className="flex min-w-0 items-center gap-2 text-sm text-tertiary">
                    {onClose && <ButtonUtility icon={mode === "peek" ? ArrowRight : ArrowLeft} size="sm" color="tertiary" tooltip="Close issue" onClick={onClose} />}
                    {mode === "page" && <><Link to={`/projects/${issue.projectId}`} className="truncate hover:text-primary">
                        {issue.project.name}
                    </Link>
                    <span>/</span>
                    <span className="font-mono text-xs text-accent-primary">{issue.identifier}</span></>}
                </div>
                <div className="flex items-center gap-2">
                    {mode === "peek" && <span className="text-body-xs-regular text-tertiary" role="status">{updateIssue.isPending ? "Saving…" : titleDirty.current || descriptionDirty.current ? "Unsaved changes" : "Saved"}</span>}
                    <ButtonUtility
                        icon={Link2}
                        size="sm"
                        color="tertiary"
                        tooltip="Copy issue link"
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/projects/${issue.projectId}/issues/${issue.identifier}`)}
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
                    {mode === "peek" ? <Popover.Root>
                        <Popover.Trigger render={<ButtonUtility icon={MoreHorizontalOutline} size="sm" color="tertiary" tooltip="Issue actions" />} />
                        <Popover.Portal><Popover.Positioner sideOffset={4} align="end" className="z-50"><Popover.Popup className="rounded-md border border-subtle bg-layer-2 p-1 shadow-overlay-100">
                            <Popover.Title className="sr-only">Issue actions</Popover.Title>
                            <ConfirmDialog trigger={<Button color="tertiary" size="sm" iconLeading={Trash2}>Delete issue</Button>} title="Delete issue" description={`The issue "${issue.title}" will be deleted permanently.`} confirmLabel="Delete issue" isPending={deleteIssue.isPending} onConfirm={() => deleteIssue.mutate(issue.identifier, { onSuccess: onClose })} />
                        </Popover.Popup></Popover.Positioner></Popover.Portal>
                    </Popover.Root> : <ButtonUtility icon={X} size="sm" color="tertiary" tooltip="Close" onClick={onClose ?? (() => navigate(`/projects/${issue.projectId}/issues`))} />}
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className={mode === "peek" ? "issue-peek-body px-8 py-5" : "mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 lg:flex-row lg:items-start lg:gap-6 lg:px-8"}>
                    <div className="min-w-0 flex-1">
                        {mode === "peek" && <div className="mb-2 text-caption-md-regular text-tertiary">{issue.identifier}</div>}
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
                            className={cx("w-full resize-none overflow-hidden border-0 bg-transparent text-primary outline-none placeholder:text-tertiary focus-visible:ring-1 focus-visible:ring-accent-strong", mode === "peek" ? "block text-body-md-regular leading-tight" : "min-h-8 text-2xl leading-8 font-semibold")}
                            aria-label="Issue title"
                        />
                        {titleSaveError && <p role="alert" className="mt-1 text-xs text-danger-primary">{titleSaveError}</p>}

                        {mode === "page" && <div className="mt-5 lg:hidden">
                            <IssueProperties issue={issue} projectIssues={projectIssues} columns={columns} members={members} categories={categories} cycles={cycles} save={save} error={propertySaveError} isPending={updateIssue.isPending} />
                        </div>}

                        <section className={mode === "peek" ? "peek-description mt-2" : "mt-6 border-b border-subtle pb-6"}>
                            <div onFocus={() => setDescriptionEditing(true)}>
                            <RichTextEditor
                                toolbar={mode === "page" || descriptionEditing}
                                variant="description"
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
                            </div>
                            {(mode === "page" || descriptionEditing) && <div className="mt-2 flex justify-end">
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
                                                        if (descriptionVersion.current === saveVersion) { descriptionDirty.current = false; setDescriptionEditing(false); }
                                                    },
                                                    onError: (reason) => setDescriptionSaveError(errorMessage(reason)),
                                                },
                                            );
                                        })()
                                    }
                                >
                                    Save description
                                </Button>
                            </div>}
                            {descriptionSaveError && <p role="alert" className="mt-2 text-right text-xs text-danger-primary">{descriptionSaveError}</p>}
                        </section>

                        {mode === "peek" && <>
                            <div className="mt-8 flex justify-end gap-1 text-caption-md-regular text-tertiary"><HistoryOutline className="size-3.5" />Updated {formatDistanceToNow(issue.updatedAt)}</div>
                            <div className="mt-10 mb-12 flex flex-wrap items-center gap-2">
                                <Button size="md" color="secondary" iconLeading={Link2} onClick={() => setRelationsOpen(!relationsOpen)} aria-expanded={relationsOpen}>Add relation</Button>
                                <Button size="md" color="secondary" iconLeading={ParentOutline} onClick={() => document.querySelector<HTMLInputElement>(".plane-issue-peek [aria-label='Parent']")?.focus()}>Add parent</Button>
                            </div>
                        </>}
                        <IssueSubIssues issue={issue} columns={columns ?? []} />
                        {(mode === "page" || relationsOpen || !!relations?.length) && <IssueRelations
                            projectId={issue.projectId}
                            issueId={issue.id}
                            projectIssues={projectIssues ?? []}
                            relations={relations ?? []}
                            isPending={createRelation.isPending || deleteRelation.isPending}
                            onAdd={(targetIssueIdentifier, type) => createRelation.mutateAsync({ targetIssueIdentifier, type }).then(() => undefined)}
                            onDelete={(relationId) => deleteRelation.mutate(relationId)}
                        />}
                        {mode === "peek" && <PeekProperties issue={issue} projectIssues={projectIssues} columns={columns} members={members} categories={categories} cycles={cycles} save={save} error={propertySaveError} isPending={updateIssue.isPending} />}
                        {mode === "peek" && <h2 className="mt-6 mb-4 text-h6-medium text-primary">Activity</h2>}
                        <IssueActivity hideHeading={mode === "peek"} activity={activity ?? []} columns={columns ?? []} members={members ?? []} categories={categories ?? []} cycles={cycles ?? []} projectIssues={projectIssues ?? []} />
                        <IssueComments compact={mode === "peek"}
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

                        {mode === "page" && <div className="flex justify-end border-t border-subtle pt-4">
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
                        </div>}
                    </div>

                    {mode === "page" && <aside className="hidden w-64 shrink-0 border-l border-subtle pl-6 lg:block">
                        <IssueProperties issue={issue} projectIssues={projectIssues} columns={columns} members={members} categories={categories} cycles={cycles} save={save} error={propertySaveError} isPending={updateIssue.isPending} />
                    </aside>}
                </div>
            </div>
        </div>
    );

    return mode === "peek" ? (
        <Sheet open onOpenChange={(open) => !open && onClose?.()} title={`Issue ${issue.identifier}`}>
            <div ref={peekRef} tabIndex={-1} className="flex h-full min-h-0 flex-col outline-none">{content}</div>
        </Sheet>
    ) : (
        <main className="h-full min-h-0 bg-surface-1">{content}</main>
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
    columns?: Array<{ id: string; name: string; color?: string | null }>;
    members?: Array<{ id: string; name: string }>;
    categories?: Array<{ id: string; name: string; color?: string | null }>;
    cycles?: Array<{ id: string; name: string }>;
    save: (input: UpdateIssueInput) => void;
    error?: string | null;
    isPending: boolean;
}) {
    return (
        <div className="flex flex-col gap-2">
            <h2 className="mb-1 text-xs font-medium tracking-wide text-tertiary uppercase">Properties</h2>
            {error && <p role="alert" className="text-xs text-danger-primary">{error}</p>}
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
            <div className="mt-2 flex flex-col gap-2 border-t border-subtle pt-3 text-xs">
                <ReadOnlyProperty label="Project" value={`${issue.project.name} · ${issue.project.issueKey}`} />
                <ReadOnlyProperty label="Created by" value={issue.createdBy.name} />
                <ReadOnlyProperty label="Created" value={formatDate(issue.createdAt)} />
                <ReadOnlyProperty label="Updated" value={formatDate(issue.updatedAt)} />
            </div>
        </div>
    );
}

/** Plane side-peek uses a single property list with 30px controls and 12px row gaps. */
function PeekProperties({ issue, projectIssues, columns, members, categories, cycles, save, error, isPending }: Parameters<typeof IssueProperties>[0]) {
    const rows = [
        { label: "Status", displayLabel: "State", Icon: StateOutline, value: issue.columnId, options: (columns ?? []).map((c) => ({ value: c.id, label: c.name })), change: (value: string) => save({ columnId: value }), decoration: <StateIcon name={columns?.find((c) => c.id === issue.columnId)?.name ?? ""} color={columns?.find((c) => c.id === issue.columnId)?.color} /> },
        { label: "Assignee", Icon: AssigneeOutline, value: issue.assigneeId ?? "", options: [{ value: "", label: "Unassigned" }, ...(members ?? []).map((m) => ({ value: m.id, label: m.name }))], change: (value: string) => save({ assigneeId: value || null }), searchable: true, decoration: issue.assigneeId ? <IssueAvatar name={members?.find((m) => m.id === issue.assigneeId)?.name ?? ""} /> : null },
        { label: "Priority", Icon: PriorityOutline, value: issue.priority, options: ["low", "medium", "high"].map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) })), change: (value: string) => save({ priority: value as "low" | "medium" | "high" }), decoration: <PriorityIcon priority={issue.priority} /> },
        { label: "Created by", Icon: AssigneeOutline, readonly: issue.createdBy.name, decoration: <IssueAvatar name={issue.createdBy.name} avatarUrl={issue.createdBy.avatarUrl} /> },
        { label: "Estimate", Icon: EstimateOutline, value: String(issue.estimate ?? ""), options: [{ value: "", label: "No estimate" }, ...[1, 2, 3, 5, 8].map((n) => ({ value: String(n), label: `${n} points` }))], change: (value: string) => save({ estimate: value ? Number(value) : null }) },
        { label: "Cycle", Icon: CyclesOutline, value: issue.cycleId ?? "", options: [{ value: "", label: "Add cycle" }, ...(cycles ?? []).map((c) => ({ value: c.id, label: c.name }))], change: (value: string) => save({ cycleId: value || null }), searchable: true },
        { label: "Parent", Icon: ParentOutline, value: issue.parent?.id ?? "", options: [{ value: "", label: "Add parent issue" }, ...(projectIssues ?? []).filter((i) => i.id !== issue.id).map((i) => ({ value: i.id, label: `${i.identifier} · ${i.title}` }))], change: (value: string) => save({ parentIssueId: value || null }), searchable: true },
        { label: "Label", Icon: LabelsOutline, value: issue.categoryId ?? "", options: [{ value: "", label: "Add label" }, ...(categories ?? []).map((c) => ({ value: c.id, label: c.name }))], change: (value: string) => save({ categoryId: value || null }), searchable: true, decoration: issue.categoryId ? <LabelsOutline className="size-3.5" style={{ color: categories?.find((c) => c.id === issue.categoryId)?.color ?? "#7a5af8" }} /> : null },
    ];
    return <section aria-label="Properties">
        <h2 className="mb-3 text-body-xs-medium text-primary">Properties</h2>
        <div className="space-y-3">
            {rows.map((row) => <div key={row.label} className="peek-property-row flex min-h-[30px] items-center gap-3">
                <span className="flex w-[122px] shrink-0 items-center gap-1.5 text-body-xs-regular text-tertiary"><row.Icon className="size-4" />{row.displayLabel ?? row.label}</span>
                <div className={cx("peek-property-value relative min-w-0 flex-1", !!row.decoration && "has-decoration")}>
                    {row.decoration && <span className="pointer-events-none absolute top-1.5 left-0 z-10 flex size-[18px] items-center justify-center">{row.decoration}</span>}
                    {row.readonly ? <span className="block py-1.5 pl-6 text-body-xs-medium text-secondary">{row.readonly}</span> : <PropertySelect label={row.label} value={row.value!} options={row.options!} onChange={row.change!} searchable={row.searchable} isDisabled={isPending} className="peek-property-control" />}
                </div>
            </div>)}
        </div>
        {error && <p role="alert" className="mt-2 text-xs text-danger-primary">{error}</p>}
    </section>;
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
        <section className="border-t border-subtle pt-5">
            <SectionTitle title={`Sub-issues · ${issue.children.length}`} icon={CheckCircle} />
            <div className="mb-3 flex flex-wrap gap-2">
                {[...statusCounts.entries()].map(([status, count]) => (
                    <span key={status} className="rounded-full border border-subtle bg-surface-2 px-2 py-1 text-[11px] text-tertiary">
                        {status} · {count}
                    </span>
                ))}
            </div>
            <div className="divide-y divide-subtle rounded-lg border border-subtle">
                {issue.children.map((child) => (
                    <Link
                        key={child.id}
                        to={`/projects/${issue.projectId}/issues/${issue.project.issueKey}-${child.number}`}
                        className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-surface-2"
                    >
                        <span className="font-mono text-xs text-accent-primary">
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
        <section className="border-t border-subtle pt-5">
            <SectionTitle title="Relations" icon={Link2} />
            <div className="divide-y divide-subtle rounded-lg border border-subtle">
                {relations.map((relation) => (
                    <div key={relation.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                        <span className="shrink-0 text-xs text-tertiary">{relation.type.replace("_", " ")}</span>
                        <Link
                            to={`/projects/${relation.target.projectId || projectId}/issues/${relation.target.project.issueKey}-${relation.target.number}`}
                            className="flex min-w-0 flex-1 items-center gap-2 hover:text-accent-primary"
                        >
                            <span className="font-mono text-xs text-accent-primary">
                                {relation.target.project.issueKey}-{relation.target.number}
                            </span>
                            <span className="truncate text-primary">{relation.target.title}</span>
                        </Link>
                        <ButtonUtility icon={Trash2} size="xs" color="tertiary" className="text-danger-primary hover:text-danger-secondary" tooltip="Remove relation" onClick={() => onDelete(relation.id)} isDisabled={isPending} />
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
            {error && <p role="alert" className="mt-2 text-xs text-danger-primary">{error}</p>}
        </section>
    );
}

function IssueActivity({ hideHeading = false, activity, columns, members, categories, cycles, projectIssues }: {
    hideHeading?: boolean;
    activity: Array<{ id: string; type: string; createdAt: string; actor: { name: string }; payload: Record<string, unknown> }>;
    columns: Array<{ id: string; name: string }>;
    members: Array<{ id: string; name: string }>;
    categories: Array<{ id: string; name: string }>;
    cycles: Array<{ id: string; name: string }>;
    projectIssues: Array<{ id: string; identifier: string; title: string }>;
}) {
    if (!activity.length) return null;
    return (
        <section className="border-t border-subtle pt-5">
            {!hideHeading && <SectionTitle title="Activity" icon={Calendar} />}
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
    compact = false,
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
    compact?: boolean;
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
        <section className={compact ? "peek-comments" : "border-t border-subtle pt-5"}>
            {!compact && <SectionTitle title="Comments" icon={User} />}
            <div className="flex flex-col gap-4">
                {comments.map((entry) => (
                    <article key={entry.id} className="rounded-lg border border-subtle p-4">
                        <div className="mb-2 flex items-center justify-between gap-3 text-xs text-tertiary">
                            <span className="font-medium text-secondary">{entry.author.name}</span>
                            <span>{formatDistanceToNow(entry.createdAt)}</span>
                        </div>
                        {editingId === entry.id ? (
                            <>
                                <RichTextEditor variant="comment" content={editingContent} onChange={setEditingContent} />
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
                            <RichTextEditor variant="comment" content={entry.contentJson} editable={false} />
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
                                    className="text-xs text-danger-primary disabled:cursor-not-allowed disabled:opacity-50"
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
                <div className="rounded-lg border border-subtle">
                    <RichTextEditor toolbar={!compact} variant="comment" content={value} onChange={onChange} onSubmitShortcut={onSubmit} placeholder="Leave a comment..." />
                    <div className="flex justify-end border-t border-subtle p-2">
                        <Button size="sm" iconLeading={Plus} isDisabled={!value.content?.length || isSubmitting} isLoading={isSubmitting} onClick={onSubmit}>
                            Comment
                        </Button>
                    </div>
                </div>
            </div>
            {error && <p role="alert" className="mt-2 text-xs text-danger-primary">{error}</p>}
        </section>
    );
}

function SectionTitle({ title, icon: Icon }: { title: string; icon: typeof CheckCircle }) {
    return (
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
            <Icon className="size-4 text-placeholder" />
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
    return <Sheet open onOpenChange={(open) => !open && onClose?.()} title="Issue panel"><div className="flex h-full min-h-0 flex-col">{children}</div></Sheet>;
}

function IssueLoadingSkeleton({ mode }: { mode: "page" | "peek" }) {
    return (
        <div
            className="flex h-full min-h-0 flex-col"
            role="status"
            aria-label={mode === "peek" ? "Loading issue" : "Loading issue details"}
            aria-live="polite"
        >
            {mode === "page" && (
                <div className="flex h-12 shrink-0 items-center border-b border-subtle px-4">
                    <Skeleton className="h-4 w-52" />
                </div>
            )}
            <div
                className={
                    mode === "peek"
                        ? "issue-peek-body flex-1 space-y-5 overflow-y-auto px-8 py-5"
                        : "mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 lg:flex-row lg:items-start lg:gap-6 lg:px-8"
                }
            >
                <div className="min-w-0 flex-1 space-y-5">
                    {mode === "peek" && <Skeleton className="h-3 w-16" />}
                    <Skeleton className="h-8 w-4/5" />
                    <Skeleton className="h-24 w-full" />
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                </div>
                <div className={mode === "peek" ? "space-y-4" : "w-full shrink-0 space-y-4 lg:w-72"}>
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                </div>
            </div>
        </div>
    );
}

function errorMessage(reason: unknown, fallback = "Could not save the issue.") {
    if (reason instanceof ApiError) return reason.message;
    if (reason instanceof Error) return reason.message;
    return fallback;
}
