import { useEffect, useRef, useState } from "react";
import type { TiptapDocument, UpdateIssueInput } from "@gikan/shared";
import { ArrowLeft, ArrowRight, CheckCircle, Copy, ExternalLink, Link2, Plus, Trash2, X } from "lucide-react";
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
import { ContextMenuButton } from "@/components/overlay/context-menu-provider";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useClipboard } from "@/hooks/use-clipboard";
import { useColumns } from "@/features/board/hooks/use-board";
import { useCategories } from "@/features/categories/hooks/use-categories";
import { useProjectMembers } from "@/features/projects/hooks/use-project-members";
import { ApiError } from "@/lib/api-client";
import {
    useCreateIssue,
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
import { fetchIssueClipboardContent } from "../lib/issue-clipboard";
import { issueDescriptionDrafts, issueDraftKey } from "../lib/issue-description-drafts";
import { EMPTY_TIPTAP_DOCUMENT, RichTextEditor } from "./rich-text-editor";
import { useTranslation } from "react-i18next";
import type { TranslationKey } from "@/i18n/resources";

interface IssueViewProps {
    identifier?: string;
    projectId?: string;
    mode?: "page" | "peek";
    onClose?: () => void;
}

const activityLabelKeys: Record<string, TranslationKey> = {
    created: "issue.createdThisIssue",
    status_changed: "issue.changedStatus",
    priority_changed: "issue.changedPriority",
    assignee_changed: "issue.changedAssignee",
    category_changed: "issue.changedCategory",
    cycle_changed: "issue.changedCycle",
    estimate_changed: "issue.changedEstimate",
    parent_changed: "issue.changedParent",
    relation_added: "issue.addedRelation",
    relation_removed: "issue.removedRelation",
};

export const IssueView = ({ identifier, projectId, mode = "page", onClose }: IssueViewProps) => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const params = useParams<{ projectId: string; issueIdentifier: string }>();
    const resolvedIdentifier = identifier ?? params.issueIdentifier ?? "";
    const resolvedProjectId = projectId ?? params.projectId ?? "";
    const { user } = useAuth();
    const { copy, copied } = useClipboard();
    const { data: issue, isLoading, isError } = useIssue(resolvedIdentifier);
    const updateIssue = useUpdateIssue(issue?.projectId ?? resolvedProjectId);
    const createIssue = useCreateIssue(issue?.projectId ?? resolvedProjectId);
    const deleteIssue = useDeleteIssue(issue?.projectId ?? resolvedProjectId);
    const { data: comments, isLoading: commentsLoading, isError: commentsLoadFailed } = useIssueComments(issue?.identifier ?? resolvedIdentifier);
    const { data: activity, isLoading: activityLoading, isError: activityLoadFailed } = useIssueActivity(issue?.identifier ?? resolvedIdentifier);
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
    const [descriptionStatus, setDescriptionStatus] = useState<"saved" | "unsaved" | "saving" | "offline" | "error" | "conflict">("saved");
    const [discussionTab, setDiscussionTab] = useState<"comments" | "activity">("comments");
    const [propertySaveError, setPropertySaveError] = useState<string | null>(null);
    const [commentSaveError, setCommentSaveError] = useState<string | null>(null);
    const [isCopyingIssue, setIsCopyingIssue] = useState(false);
    const [issueCopyError, setIssueCopyError] = useState(false);
    const loadedIssueId = useRef<string | null>(null);
    const titleDirty = useRef(false);
    const descriptionDirty = useRef(false);
    const titleVersion = useRef(0);
    const descriptionVersion = useRef(0);
    const descriptionRevision = useRef(0);
    const latestDescription = useRef<TiptapDocument>(EMPTY_TIPTAP_DOCUMENT);
    const savedDescription = useRef<TiptapDocument>(EMPTY_TIPTAP_DOCUMENT);
    const descriptionSaveLoop = useRef<Promise<void> | null>(null);
    const descriptionDraftKey = useRef<string | null>(null);
    const descriptionDraftContext = useRef<{ key: string; userId: string; projectId: string; issueId: string } | null>(null);
    const descriptionDraftRestoreIssue = useRef<string | null>(null);
    const commentDraftRestoreIssue = useRef<string | null>(null);
    const commentDraftOwner = useRef<string | null>(null);
    const flushDescriptionRef = useRef<() => Promise<void>>(async () => undefined);
    const persistDescriptionDraftRef = useRef<() => void>(() => undefined);
    const persistCommentDraftRef = useRef<() => void>(() => undefined);
    const titleRef = useRef<HTMLTextAreaElement>(null);
    const peekRef = useRef<HTMLDivElement>(null);

    useBeforeUnload((event) => {
        if (!titleDirty.current && !descriptionDirty.current && !hasMeaningfulTiptapContent(comment)) return;
        event.preventDefault();
        event.returnValue = "";
    });

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
                event.preventDefault();
                void flushDescriptionRef.current();
            }
        };
        const handleOnline = () => {
            if (descriptionDirty.current) void flushDescriptionRef.current();
        };
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("online", handleOnline);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("online", handleOnline);
        };
    }, []);

    useEffect(() => {
        if (!issue) return;
        if (loadedIssueId.current !== issue.id) {
            if (loadedIssueId.current) {
                persistDescriptionDraftRef.current();
                persistCommentDraftRef.current();
            }
            loadedIssueId.current = issue.id;
            titleDirty.current = false;
            descriptionDirty.current = false;
            descriptionVersion.current = 0;
            setTitle(issue.title);
            setDescription(issue.descriptionJson ?? EMPTY_TIPTAP_DOCUMENT);
            latestDescription.current = issue.descriptionJson ?? EMPTY_TIPTAP_DOCUMENT;
            savedDescription.current = issue.descriptionJson ?? EMPTY_TIPTAP_DOCUMENT;
            descriptionRevision.current = issue.descriptionRevision;
            descriptionDraftKey.current = user?.id ? issueDraftKey(user.id, issue.projectId, issue.id) : null;
            descriptionDraftContext.current = user?.id && descriptionDraftKey.current ? { key: descriptionDraftKey.current, userId: user.id, projectId: issue.projectId, issueId: issue.id } : null;
            descriptionDraftRestoreIssue.current = null;
            commentDraftRestoreIssue.current = null;
            commentDraftOwner.current = null;
            setComment(EMPTY_TIPTAP_DOCUMENT);
            setCommentSaveError(null);
            setTitleSaveError(null);
            setDescriptionSaveError(null);
            setPropertySaveError(null);
            setIssueCopyError(false);
            setDescriptionStatus("saved");
            setDescriptionEditing(false);
            setRelationsOpen(false);
            try {
                const storedTab = sessionStorage.getItem(`gikan-issue-discussion-tab:${issue.id}`);
                setDiscussionTab(storedTab === "activity" ? "activity" : "comments");
            } catch { setDiscussionTab("comments"); }
            return;
        }

        if (descriptionDraftContext.current?.userId !== user?.id) {
            persistDescriptionDraftRef.current();
            persistCommentDraftRef.current();
            const key = user?.id ? issueDraftKey(user.id, issue.projectId, issue.id) : null;
            descriptionDraftKey.current = key;
            descriptionDraftContext.current = user?.id && key ? { key, userId: user.id, projectId: issue.projectId, issueId: issue.id } : null;
        }

        if (!titleDirty.current) setTitle(issue.title);
        if (!descriptionDirty.current && issue.descriptionRevision !== descriptionRevision.current) {
            const nextDescription = issue.descriptionJson ?? EMPTY_TIPTAP_DOCUMENT;
            descriptionRevision.current = issue.descriptionRevision;
            latestDescription.current = nextDescription;
            savedDescription.current = nextDescription;
            setDescription(nextDescription);
            setDescriptionStatus("saved");
        }
    }, [issue, user?.id]);

    useEffect(() => {
        if (!issue || !user?.id || descriptionDraftRestoreIssue.current === issue.id) return;
        descriptionDraftRestoreIssue.current = issue.id;
        const key = issueDraftKey(user.id, issue.projectId, issue.id);
        descriptionDraftKey.current = key;
        let cancelled = false;
        void issueDescriptionDrafts.get(key).then((draft) => {
            if (cancelled || !draft?.descriptionJson || loadedIssueId.current !== issue.id || descriptionDirty.current) return;
            if (JSON.stringify(draft.descriptionJson) === JSON.stringify(issue.descriptionJson)) {
                void issueDescriptionDrafts.clearDescription(key).catch(() => undefined);
                return;
            }
            latestDescription.current = draft.descriptionJson;
            descriptionDirty.current = true;
            descriptionVersion.current += 1;
            setDescription(draft.descriptionJson);
            if (draft.baseRevision === issue.descriptionRevision) {
                setDescriptionStatus("unsaved");
            } else {
                setDescriptionStatus("conflict");
                setDescriptionSaveError(t("issue.descriptionConflict"));
            }
        }).catch(() => undefined);
        return () => {
            cancelled = true;
            if (descriptionDraftRestoreIssue.current === issue.id) descriptionDraftRestoreIssue.current = null;
        };
    }, [issue?.id, issue?.projectId, issue?.descriptionRevision, user?.id, t]);

    useEffect(() => {
        if (!issue || !user?.id || commentDraftRestoreIssue.current === issue.id) return;
        commentDraftRestoreIssue.current = issue.id;
        const key = issueDraftKey(user.id, issue.projectId, issue.id);
        let cancelled = false;
        void issueDescriptionDrafts.get(key).then((draft) => {
            if (cancelled || loadedIssueId.current !== issue.id || commentDraftOwner.current) return;
            setComment(draft?.commentJson ?? EMPTY_TIPTAP_DOCUMENT);
            commentDraftOwner.current = issue.id;
        }).catch(() => { if (!cancelled && loadedIssueId.current === issue.id) commentDraftOwner.current = issue.id; });
        return () => {
            cancelled = true;
            if (commentDraftRestoreIssue.current === issue.id) commentDraftRestoreIssue.current = null;
        };
    }, [issue?.id, issue?.projectId, user?.id]);

    useEffect(() => {
        if (!issue || !descriptionDirty.current) return;
        const draftTimer = window.setTimeout(() => {
            const key = descriptionDraftKey.current;
            if (!key || !user?.id) return;
            void issueDescriptionDrafts.putDescription({
                key,
                userId: user.id,
                projectId: issue.projectId,
                issueId: issue.id,
                baseRevision: descriptionRevision.current,
                descriptionJson: latestDescription.current,
                updatedAt: Date.now(),
            }).catch(() => undefined);
        }, 150);
        const saveTimer = descriptionStatus === "conflict"
            ? undefined
            : window.setTimeout(() => { void flushDescriptionRef.current(); }, 1000);
        return () => {
            window.clearTimeout(draftTimer);
            if (saveTimer !== undefined) window.clearTimeout(saveTimer);
        };
    }, [description, issue?.id, user?.id]);

    useEffect(() => {
        if (!issue || !user?.id || commentDraftOwner.current !== issue.id) return;
        const timer = window.setTimeout(() => {
            const key = issueDraftKey(user.id, issue.projectId, issue.id);
            const content = hasMeaningfulTiptapContent(comment) ? comment : undefined;
            const save = content
                ? issueDescriptionDrafts.putComment({ key, userId: user.id, projectId: issue.projectId, issueId: issue.id, commentJson: content, updatedAt: Date.now() })
                : issueDescriptionDrafts.clearComment(key);
            void save.catch(() => undefined);
        }, 150);
        return () => window.clearTimeout(timer);
    }, [comment, issue?.id, user?.id]);

    useEffect(() => () => {
        persistDescriptionDraftRef.current();
        persistCommentDraftRef.current();
    }, []);

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

    flushDescriptionRef.current = async () => {
        if (!issue || !descriptionDirty.current) return;
        if (descriptionSaveLoop.current) return descriptionSaveLoop.current;

        const issueId = issue.id;
        const draftKey = descriptionDraftKey.current;
        const operation = (async () => {
            while (descriptionDirty.current && loadedIssueId.current === issueId) {
                const nextDescription = latestDescription.current;
                if (JSON.stringify(nextDescription) === JSON.stringify(savedDescription.current)) {
                    descriptionDirty.current = false;
                    setDescriptionStatus("saved");
                    if (draftKey) void issueDescriptionDrafts.clearDescription(draftKey).catch(() => undefined);
                    break;
                }
                setDescriptionStatus("saving");
                setDescriptionSaveError(null);
                try {
                    const updated = await updateIssue.mutateAsync({
                        identifier: issue.identifier,
                        input: { descriptionJson: nextDescription, expectedDescriptionRevision: descriptionRevision.current },
                    });
                    if (loadedIssueId.current !== issueId) {
                        if (draftKey) void issueDescriptionDrafts.clearDescription(draftKey).catch(() => undefined);
                        break;
                    }
                    descriptionRevision.current = updated.descriptionRevision;
                    savedDescription.current = nextDescription;
                    if (JSON.stringify(latestDescription.current) === JSON.stringify(nextDescription)) {
                        descriptionDirty.current = false;
                        setDescriptionStatus("saved");
                        setDescriptionSaveError(null);
                        if (draftKey) void issueDescriptionDrafts.clearDescription(draftKey).catch(() => undefined);
                    } else {
                        descriptionDirty.current = true;
                        setDescriptionStatus("unsaved");
                    }
                } catch (reason) {
                    if (loadedIssueId.current !== issueId) break;
                    const conflict = reason instanceof ApiError && reason.status === 409;
                    setDescriptionStatus(conflict ? "conflict" : !navigator.onLine ? "offline" : "error");
                    setDescriptionSaveError(errorMessage(reason, t("issue.couldNotSaveIssue")));
                    break;
                }
            }
        })();
        descriptionSaveLoop.current = operation;
        try {
            await operation;
        } finally {
            if (descriptionSaveLoop.current === operation) descriptionSaveLoop.current = null;
            if (descriptionDirty.current && loadedIssueId.current !== issueId) queueMicrotask(() => void flushDescriptionRef.current());
        }
    };

    persistDescriptionDraftRef.current = () => {
        const context = descriptionDraftContext.current;
        if (!context || !descriptionDirty.current) return;
        void issueDescriptionDrafts.putDescription({
            ...context,
            baseRevision: descriptionRevision.current,
            descriptionJson: latestDescription.current,
            updatedAt: Date.now(),
        }).catch(() => undefined);
    };
    persistCommentDraftRef.current = () => {
        const context = descriptionDraftContext.current;
        if (!context || commentDraftOwner.current !== context.issueId) return;
        const content = hasMeaningfulTiptapContent(comment) ? comment : undefined;
        const save = content
            ? issueDescriptionDrafts.putComment({ ...context, commentJson: content, updatedAt: Date.now() })
            : issueDescriptionDrafts.clearComment(context.key);
        void save.catch(() => undefined);
    };

    if (isLoading) {
        const state = <IssueLoadingSkeleton mode={mode} />;
        return mode === "peek" ? <IssuePeekState onClose={onClose}>{state}</IssuePeekState> : state;
    }
    if (isError || !issue) {
        const state = <ErrorMessage message={t("issue.couldNotLoadIssue")} />;
        return mode === "peek" ? <IssuePeekState onClose={onClose}>{state}</IssuePeekState> : state;
    }

    const save = (input: UpdateIssueInput) => {
        const actionIssueId = issue.id;
        setPropertySaveError(null);
        updateIssue.mutate(
            { identifier: issue.identifier, input },
            { onError: (reason) => { if (loadedIssueId.current === actionIssueId) setPropertySaveError(errorMessage(reason, t("issue.couldNotSaveIssue"))); } },
        );
    };
    const copyIssueContent = async () => {
        setIsCopyingIssue(true);
        setIssueCopyError(false);
        try {
            const content = await fetchIssueClipboardContent(issue.identifier, {
                title: title.trim() || issue.title,
                description,
            });
            const result = await copy(content, "issue-content");
            setIssueCopyError(!result.success);
        } catch {
            setIssueCopyError(true);
        } finally {
            setIsCopyingIssue(false);
        }
    };
    const selectDiscussionTab = (tab: "comments" | "activity") => {
        setDiscussionTab(tab);
        try { sessionStorage.setItem(`gikan-issue-discussion-tab:${issue.id}`, tab); } catch { /* Storage is optional. */ }
    };
    const handleDiscussionTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (!(["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))) return;
        event.preventDefault();
        const tabs = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("[role='tab']") ?? []);
        if (!tabs.length) return;
        const index = tabs.indexOf(event.currentTarget);
        const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
        tabs[next]?.focus();
        const value = tabs[next]?.dataset.discussionTab;
        if (value === "comments" || value === "activity") selectDiscussionTab(value);
    };
    const content = (
        <div className={cx("flex h-full min-h-0 flex-col", mode === "peek" && "plane-issue-peek")}>
            <div className={cx("issue-view-header flex items-center justify-between gap-3 px-4 py-3", mode === "page" && "border-b border-subtle")}>
                <div className="flex min-w-0 items-center gap-2 text-sm text-tertiary">
                    {onClose && <ButtonUtility icon={mode === "peek" ? ArrowRight : ArrowLeft} size="sm" color="tertiary" tooltip={t("issue.closeIssue")} onClick={onClose} />}
                    {mode === "page" && <><Link to={`/projects/${issue.projectId}`} className="truncate hover:text-primary">
                        {issue.project.name}
                    </Link>
                    <span>/</span>
                    <span className="font-mono text-xs text-accent-primary">{issue.identifier}</span></>}
                </div>
                <div className="flex items-center gap-2">
                    {mode === "peek" && <span className="text-body-xs-regular text-tertiary" role="status">{updateIssue.isPending || descriptionStatus === "saving" ? t("issue.savingIssue") : titleDirty.current || descriptionDirty.current ? t("issue.unsavedIssue") : t("issue.savedIssue")}</span>}
                    <ButtonUtility
                        icon={Link2}
                        size="sm"
                        color="tertiary"
                        tooltip={t("issue.copyIssueLink")}
                        onClick={() => navigator.clipboard.writeText(`${window.location.origin}/projects/${issue.projectId}/issues/${issue.identifier}`)}
                    />
                    {mode === "peek" && (
                        <ButtonUtility
                            icon={copied ? CheckCircle : Copy}
                            size="sm"
                            color="tertiary"
                            tooltip={issueCopyError ? t("issue.couldNotCopyContent") : copied ? t("issue.copiedContent") : t("issue.copyContent")}
                            isDisabled={isCopyingIssue}
                            onClick={() => void copyIssueContent()}
                        />
                    )}
                    {mode === "peek" && (
                        <ButtonUtility
                            icon={ExternalLink}
                            size="sm"
                            color="tertiary"
                            tooltip={t("issue.openFullPage")}
                            onClick={() => navigate(`/projects/${issue.projectId}/issues/${issue.identifier}`, { replace: true })}
                        />
                    )}
                    {mode === "peek" ? <Popover.Root>
                        <Popover.Trigger render={<ButtonUtility icon={MoreHorizontalOutline} size="sm" color="tertiary" tooltip={t("issue.issueActions")} />} />
                        <Popover.Portal><Popover.Positioner sideOffset={4} align="end" className="z-50"><Popover.Popup className="rounded-md border border-subtle bg-layer-2 p-1 shadow-overlay-100">
                            <Popover.Title className="sr-only">{t("issue.issueActions")}</Popover.Title>
                            <ConfirmDialog trigger={<Button color="tertiary" size="sm" iconLeading={Trash2}>{t("issue.deleteIssue")}</Button>} title={t("issue.deleteIssue")} description={t("issue.deleteIssueDescription", { title: issue.title })} confirmLabel={t("issue.deleteIssue")} isPending={deleteIssue.isPending} onConfirm={() => deleteIssue.mutate(issue.identifier, { onSuccess: onClose })} />
                        </Popover.Popup></Popover.Positioner></Popover.Portal>
                    </Popover.Root> : <ButtonUtility icon={X} size="sm" color="tertiary" tooltip={t("common.close")} onClick={onClose ?? (() => navigate(`/projects/${issue.projectId}/issues`))} />}
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
                                                if (loadedIssueId.current === issue.id && titleVersion.current === saveVersion) titleDirty.current = false;
                                            },
                                            onError: (reason) => { if (loadedIssueId.current === issue.id) setTitleSaveError(errorMessage(reason, t("issue.couldNotSaveIssue"))); },
                                        },
                                    );
                                } else {
                                    titleDirty.current = false;
                                }
                            }}
                            className="min-h-8 w-full resize-none overflow-hidden border-0 bg-transparent text-[22px] leading-[30px] font-semibold text-primary outline-none placeholder:text-tertiary focus-visible:ring-1 focus-visible:ring-accent-strong md:text-2xl md:leading-8"
                            aria-label={t("issue.title")}
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
                                    latestDescription.current = value;
                                    if (descriptionStatus !== "conflict") {
                                        setDescriptionStatus("unsaved");
                                        setDescriptionSaveError(null);
                                    }
                                    setDescription(value);
                                }}
                                mentionItems={(members ?? []).map((member) => ({ id: member.id, label: member.username, description: member.name }))}
                                placeholder={t("issue.describeIssue")}
                            />
                            </div>
                            {(mode === "page" || descriptionEditing) && <div className="mt-2 flex items-center justify-end gap-3">
                                <span className="text-xs text-tertiary" role="status" aria-live="polite">
                                    {descriptionStatus === "saving" ? t("issue.savingDescription")
                                        : descriptionStatus === "saved" ? t("issue.descriptionSaved")
                                            : descriptionStatus === "offline" ? t("issue.descriptionOffline")
                                                : descriptionStatus === "conflict" ? t("issue.descriptionConflict")
                                                    : descriptionStatus === "error" ? t("issue.descriptionSaveFailed")
                                                        : descriptionDirty.current ? t("issue.descriptionUnsaved") : ""}
                                </span>
                                <Button size="sm" color="primary" isLoading={descriptionStatus === "saving"} isDisabled={!descriptionDirty.current || descriptionStatus === "conflict"} onClick={async () => {
                                    await flushDescriptionRef.current();
                                    if (!descriptionDirty.current) setDescriptionEditing(false);
                                }}>
                                    {t("issue.saveDescription")}
                                </Button>
                            </div>}
                            {descriptionSaveError && <p role="alert" className="mt-2 text-right text-xs text-danger-primary">{descriptionSaveError}</p>}
                    {descriptionStatus === "conflict" && <div className="mt-3 flex flex-wrap items-center justify-end gap-2 rounded-md border border-fg-warning-primary/40 bg-warning-primary/10 p-3">
                                <Button size="xs" color="tertiary" onClick={() => {
                                    const current = issue.descriptionJson ?? EMPTY_TIPTAP_DOCUMENT;
                                    descriptionDirty.current = false;
                                    descriptionRevision.current = issue.descriptionRevision;
                                    latestDescription.current = current;
                                    savedDescription.current = current;
                                    setDescription(current);
                                    setDescriptionStatus("saved");
                                    setDescriptionSaveError(null);
                                    const key = descriptionDraftKey.current;
                                    if (key) void issueDescriptionDrafts.clearDescription(key).catch(() => undefined);
                                }}>{t("issue.useSavedDescription")}</Button>
                                <Button size="xs" color="primary" isLoading={createIssue.isPending} onClick={async () => {
                                    try {
                                        const suffix = ` (${t("issue.draftCopySuffix")})`;
                                        const baseTitle = title.trim() || issue.title;
                                        const created = await createIssue.mutateAsync({
                                            columnId: issue.columnId,
                                            title: `${baseTitle.slice(0, 200 - suffix.length)}${suffix}`,
                                            descriptionJson: latestDescription.current,
                                            assigneeId: issue.assigneeId,
                                            categoryId: issue.categoryId,
                                            priority: issue.priority,
                                            cycleId: issue.cycleId,
                                            estimate: issue.estimate,
                                        });
                                        const key = descriptionDraftKey.current;
                                        if (key) void issueDescriptionDrafts.clearDescription(key).catch(() => undefined);
                                        descriptionDirty.current = false;
                                        navigate(`/projects/${created.projectId}/issues/${created.identifier}`);
                                    } catch (reason) {
                                        setDescriptionSaveError(errorMessage(reason, t("issue.couldNotSaveIssue")));
                                    }
                                }}>{t("issue.createIssueFromDraft")}</Button>
                            </div>}
                        </section>

                        {mode === "peek" && <>
                            <div className="mt-8 flex justify-end gap-1 text-caption-md-regular text-tertiary"><HistoryOutline className="size-3.5" />{t("issue.updatedAgo", { time: formatDistanceToNow(issue.updatedAt, i18n.language) })}</div>
                            <div className="mt-10 mb-12 flex flex-wrap items-center gap-2">
                                <Button size="md" color="secondary" iconLeading={Link2} onClick={() => setRelationsOpen(!relationsOpen)} aria-expanded={relationsOpen}>{t("issue.addRelation")}</Button>
                                <Button size="md" color="secondary" iconLeading={ParentOutline} onClick={() => document.querySelector<HTMLInputElement>(`.plane-issue-peek [aria-label='${t("issue.parent")}']`)?.focus()}>{t("issue.addParent")}</Button>
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
                        <section className="mt-8 border-t border-subtle pt-5">
                            <div role="tablist" aria-label={t("issue.discussion")} className="flex items-center gap-5 border-b border-subtle">
                                <button type="button" role="tab" id={`issue-discussion-${issue.id}-comments`} aria-controls={`issue-discussion-${issue.id}-panel`} data-discussion-tab="comments" tabIndex={discussionTab === "comments" ? 0 : -1} aria-selected={discussionTab === "comments"} onKeyDown={handleDiscussionTabKeyDown} className={cx("border-b-2 px-0.5 pb-3 text-sm font-medium", discussionTab === "comments" ? "border-accent-primary text-primary" : "border-transparent text-tertiary hover:text-secondary")} onClick={() => selectDiscussionTab("comments")}>{t("issue.comments")} <span className="ml-1 text-xs text-tertiary">{comments?.length ?? 0}</span></button>
                                <button type="button" role="tab" id={`issue-discussion-${issue.id}-activity`} aria-controls={`issue-discussion-${issue.id}-panel`} data-discussion-tab="activity" tabIndex={discussionTab === "activity" ? 0 : -1} aria-selected={discussionTab === "activity"} onKeyDown={handleDiscussionTabKeyDown} className={cx("border-b-2 px-0.5 pb-3 text-sm font-medium", discussionTab === "activity" ? "border-accent-primary text-primary" : "border-transparent text-tertiary hover:text-secondary")} onClick={() => selectDiscussionTab("activity")}>{t("issue.activity")} <span className="ml-1 text-xs text-tertiary">{activity?.length ?? 0}</span></button>
                            </div>
                        </section>
                        <div role="tabpanel" id={`issue-discussion-${issue.id}-panel`} aria-labelledby={`issue-discussion-${issue.id}-${discussionTab}`}>
                        {discussionTab === "activity" ? <IssueActivity activity={activity ?? []} isLoading={activityLoading} isError={activityLoadFailed} columns={columns ?? []} members={members ?? []} categories={categories ?? []} cycles={cycles ?? []} projectIssues={projectIssues ?? []} /> : <IssueComments
                            compact={mode === "peek"}
                            comments={comments ?? []}
                            isLoading={commentsLoading}
                            loadFailed={commentsLoadFailed}
                            currentUserId={user?.id}
                            value={comment}
                            onChange={(value) => {
                                commentDraftOwner.current = issue.id;
                                setComment(value);
                            }}
                            isSubmitting={createComment.isPending || updateComment.isPending || deleteComment.isPending}
                            error={commentSaveError}
                            onSubmit={async () => {
                                if (!hasMeaningfulTiptapContent(comment)) return;
                                const submittedIssueId = issue.id;
                                setCommentSaveError(null);
                                try {
                                    await createComment.mutateAsync({ contentJson: comment });
                                    if (loadedIssueId.current === submittedIssueId) setComment(EMPTY_TIPTAP_DOCUMENT);
                                } catch (reason) {
                                    if (loadedIssueId.current === submittedIssueId) setCommentSaveError(errorMessage(reason, t("issue.couldNotAddComment")));
                                }
                            }}
                            onDelete={async (commentId) => {
                                const actionIssueId = issue.id;
                                setCommentSaveError(null);
                                try {
                                    await deleteComment.mutateAsync(commentId);
                                } catch (reason) {
                                    if (loadedIssueId.current === actionIssueId) setCommentSaveError(errorMessage(reason, t("issue.couldNotDeleteComment")));
                                    throw reason;
                                }
                            }}
                            onEdit={async (commentId, contentJson) => {
                                const actionIssueId = issue.id;
                                setCommentSaveError(null);
                                try {
                                    await updateComment.mutateAsync({ commentId, input: { contentJson } });
                                } catch (reason) {
                                    if (loadedIssueId.current === actionIssueId) setCommentSaveError(errorMessage(reason, t("issue.couldNotUpdateComment")));
                                    throw reason;
                                }
                            }}
                        />}
                        </div>

                        {mode === "page" && <div className="flex justify-end border-t border-subtle pt-4">
                            <ConfirmDialog
                                trigger={
                                    <Button color="secondary-destructive" size="sm" iconLeading={Trash2}>
                                        {t("issue.deleteIssue")}
                                    </Button>
                                }
                                title={t("issue.deleteIssue")}
                                description={t("issue.deleteIssueDescription", { title: issue.title })}
                                confirmLabel={t("issue.deleteIssue")}
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
        <Sheet open onOpenChange={(open) => !open && onClose?.()} title={`${t("issue.title")} ${issue.identifier}`}>
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
    options: Array<{ value: string; label: string; avatarUrl?: string | null }>;
    onChange: (value: string) => void;
    className?: string;
    isDisabled?: boolean;
    searchable?: boolean;
}) {
    const { t } = useTranslation();
    const items = options.map((option) => ({ id: option.value, label: option.label, avatarUrl: option.avatarUrl ?? undefined }));
    if (searchable) {
        return (
            <ComboBox
                className={`w-full ${className ?? ""}`}
                items={items}
                selectedKey={value || null}
                onSelectionChange={(next) => onChange(String(next ?? ""))}
                isDisabled={isDisabled}
                label={label}
                placeholder={options.find((option) => option.value === value)?.label ?? t("issue.select")}
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
    members?: Array<{ id: string; name: string; avatarUrl?: string | null }>;
    categories?: Array<{ id: string; name: string; color?: string | null }>;
    cycles?: Array<{ id: string; name: string }>;
    save: (input: UpdateIssueInput) => void;
    error?: string | null;
    isPending: boolean;
}) {
    const { t, i18n } = useTranslation();
    return (
        <div className="flex flex-col gap-2">
            <h2 className="mb-1 text-xs font-medium tracking-wide text-tertiary uppercase">{t("issue.properties")}</h2>
            {error && <p role="alert" className="text-xs text-danger-primary">{error}</p>}
            {isPending && <p className="text-xs text-tertiary">{t("issue.savingProperty")}</p>}
            <PropertySelect
                className="w-full"
                value={issue.columnId}
                label={t("issue.status")}
                options={(columns ?? []).map((column) => ({ value: column.id, label: column.name }))}
                isDisabled={isPending}
                onChange={(value) => save({ columnId: value })}
            />
            <PropertySelect
                className="w-full"
                value={issue.priority}
                label={t("issue.priority")}
                options={[
                    { value: "low", label: t("issue.low") },
                    { value: "medium", label: t("issue.medium") },
                    { value: "high", label: t("issue.high") },
                ]}
                isDisabled={isPending}
                onChange={(value) => save({ priority: value as "low" | "medium" | "high" })}
            />
            <PropertySelect
                className="w-full"
                value={issue.assigneeId ?? ""}
                label={t("issue.assignee")}
                options={[{ value: "", label: t("issue.unassigned") }, ...(members ?? []).map((member) => ({ value: member.id, label: member.name, avatarUrl: member.avatarUrl }))]}
                searchable
                isDisabled={isPending}
                onChange={(value) => save({ assigneeId: value || null })}
            />
            <PropertySelect
                className="w-full"
                value={issue.categoryId ?? ""}
                label={t("issue.label")}
                options={[{ value: "", label: t("issue.noLabel") }, ...(categories ?? []).map((category) => ({ value: category.id, label: category.name }))]}
                searchable
                isDisabled={isPending}
                onChange={(value) => save({ categoryId: value || null })}
            />
            <PropertySelect
                className="w-full"
                value={issue.cycleId ?? ""}
                label={t("issue.cycle")}
                options={[{ value: "", label: t("issue.noCycle") }, ...(cycles ?? []).map((cycle) => ({ value: cycle.id, label: cycle.name }))]}
                searchable
                isDisabled={isPending}
                onChange={(value) => save({ cycleId: value || null })}
            />
            <PropertySelect
                className="w-full"
                value={String(issue.estimate ?? "")}
                label={t("issue.estimate")}
                options={[{ value: "", label: t("issue.noEstimate") }, ...[1, 2, 3, 5, 8].map((value) => ({ value: String(value), label: t("projects.points", { count: value }) }))]}
                isDisabled={isPending}
                onChange={(value) => save({ estimate: value ? Number(value) : null })}
            />
            <PropertySelect
                className="w-full"
                value={issue.parent?.id ?? ""}
                label={t("issue.parent")}
                options={[{ value: "", label: t("issue.noParent") }, ...(projectIssues ?? []).filter((candidate) => candidate.id !== issue.id).map((candidate) => ({ value: candidate.id, label: `${candidate.identifier} · ${candidate.title}` }))]}
                searchable
                isDisabled={isPending}
                onChange={(value) => save({ parentIssueId: value || null })}
            />
            <div className="mt-2 flex flex-col gap-2 border-t border-subtle pt-3 text-xs">
                <ReadOnlyProperty label={t("issue.project")} value={`${issue.project.name} · ${issue.project.issueKey}`} />
                <ReadOnlyProperty label={t("issue.createdBy")} value={issue.createdBy.name} />
                <ReadOnlyProperty label={t("issue.created")} value={formatDate(issue.createdAt, i18n.language)} />
                <ReadOnlyProperty label={t("issue.updated")} value={formatDate(issue.updatedAt, i18n.language)} />
            </div>
        </div>
    );
}

/** Plane side-peek uses a single property list with 30px controls and 12px row gaps. */
function PeekProperties({ issue, projectIssues, columns, members, categories, cycles, save, error, isPending }: Parameters<typeof IssueProperties>[0]) {
    const { t } = useTranslation();
    const assignee = members?.find((member) => member.id === issue.assigneeId);
    const rows = [
        { label: t("issue.status"), displayLabel: t("issue.state"), Icon: StateOutline, value: issue.columnId, options: (columns ?? []).map((c) => ({ value: c.id, label: c.name })), change: (value: string) => save({ columnId: value }), decoration: <StateIcon name={columns?.find((c) => c.id === issue.columnId)?.name ?? ""} color={columns?.find((c) => c.id === issue.columnId)?.color} /> },
        { label: t("issue.assignee"), Icon: AssigneeOutline, value: issue.assigneeId ?? "", options: [{ value: "", label: t("issue.unassigned") }, ...(members ?? []).map((member) => ({ value: member.id, label: member.name, avatarUrl: member.avatarUrl }))], change: (value: string) => save({ assigneeId: value || null }), searchable: true, decoration: issue.assigneeId ? <IssueAvatar name={assignee?.name ?? ""} avatarUrl={assignee?.avatarUrl} /> : null },
        { label: t("issue.priority"), Icon: PriorityOutline, value: issue.priority, options: (["low", "medium", "high"] as const).map((value) => ({ value, label: t(`issue.${value}`) })), change: (value: string) => save({ priority: value as "low" | "medium" | "high" }), decoration: <PriorityIcon priority={issue.priority} /> },
        { label: t("issue.createdBy"), Icon: AssigneeOutline, readonly: issue.createdBy.name, decoration: <IssueAvatar name={issue.createdBy.name} avatarUrl={issue.createdBy.avatarUrl} /> },
        { label: t("issue.estimate"), Icon: EstimateOutline, value: String(issue.estimate ?? ""), options: [{ value: "", label: t("issue.noEstimate") }, ...[1, 2, 3, 5, 8].map((n) => ({ value: String(n), label: t("projects.points", { count: n }) }))], change: (value: string) => save({ estimate: value ? Number(value) : null }) },
        { label: t("issue.cycle"), Icon: CyclesOutline, value: issue.cycleId ?? "", options: [{ value: "", label: t("issue.addCycle") }, ...(cycles ?? []).map((c) => ({ value: c.id, label: c.name }))], change: (value: string) => save({ cycleId: value || null }), searchable: true },
        { label: t("issue.parent"), Icon: ParentOutline, value: issue.parent?.id ?? "", options: [{ value: "", label: t("issue.addParentIssue") }, ...(projectIssues ?? []).filter((i) => i.id !== issue.id).map((i) => ({ value: i.id, label: `${i.identifier} · ${i.title}` }))], change: (value: string) => save({ parentIssueId: value || null }), searchable: true },
        { label: t("issue.label"), Icon: LabelsOutline, value: issue.categoryId ?? "", options: [{ value: "", label: t("issue.addLabel") }, ...(categories ?? []).map((c) => ({ value: c.id, label: c.name }))], change: (value: string) => save({ categoryId: value || null }), searchable: true, decoration: issue.categoryId ? <LabelsOutline className="size-3.5" style={{ color: categories?.find((c) => c.id === issue.categoryId)?.color ?? "#7a5af8" }} /> : null },
    ];
    return <section aria-label={t("issue.properties")}>
        <h2 className="mb-3 text-body-xs-medium text-primary">{t("issue.properties")}</h2>
        <div className="space-y-3">
            {rows.map((row) => <div key={row.label} className="peek-property-row flex min-h-[30px] items-center gap-3">
                <span className="flex w-[122px] shrink-0 items-center gap-1.5 text-body-xs-regular text-tertiary"><row.Icon className="size-4" />{row.displayLabel ?? row.label}</span>
                <div className={cx("peek-property-value relative min-w-0 flex-1", !!row.decoration && "has-decoration")}>
                    {row.decoration && <span className="pointer-events-none absolute top-1.5 left-2 z-10 flex size-[18px] items-center justify-center">{row.decoration}</span>}
                    {row.readonly ? <span className="block py-1.5 pr-2 pl-8 text-body-xs-medium text-secondary">{row.readonly}</span> : <PropertySelect label={row.label} value={row.value!} options={row.options!} onChange={row.change!} searchable={row.searchable} isDisabled={isPending} className="peek-property-control" />}
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
    const { t } = useTranslation();
    if (!issue.children?.length) return null;
    const statusCounts = issue.children.reduce((counts, child) => {
        const status = columns.find((column) => column.id === child.columnId)?.name ?? t("issue.unknownStatus");
        counts.set(status, (counts.get(status) ?? 0) + 1);
        return counts;
    }, new Map<string, number>());
    return (
        <section className="border-t border-subtle pt-5">
            <SectionTitle title={`${t("issue.subIssues")} · ${issue.children.length}`} icon={CheckCircle} />
            <div className="mb-3 flex flex-wrap gap-2">
                {[...statusCounts.entries()].map(([status, count]) => (
                    <span key={status} className="rounded-full border border-subtle bg-surface-2 px-2 py-1 text-[11px] text-tertiary">
                        {status} · {count}
                    </span>
                ))}
            </div>
            <div className="divide-y divide-subtle rounded-lg border border-subtle">
                {issue.children.map((child) => (
                    <div
                        key={child.id}
                        className="flex min-w-0 items-center"
                        data-issue-id={child.id}
                        data-issue-context="true"
                        data-project-id={issue.projectId}
                        data-issue-identifier={`${issue.project.issueKey}-${child.number}`}
                        data-issue-title={child.title}
                    >
                        <Link
                            to={`/projects/${issue.projectId}/issues/${issue.project.issueKey}-${child.number}`}
                            className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-sm hover:bg-surface-2"
                        >
                            <span className="font-mono text-xs text-accent-primary">
                                {issue.project.issueKey}-{child.number}
                            </span>
                            <span className="truncate text-primary">{child.title}</span>
                        </Link>
                        <ContextMenuButton
                            entity={{ type: "issue", projectId: issue.projectId, identifier: `${issue.project.issueKey}-${child.number}`, title: child.title }}
                            className="mr-1"
                        />
                    </div>
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
    const { t } = useTranslation();
    const [targetIssueIdentifier, setTargetIssueIdentifier] = useState("");
    const [type, setType] = useState<"blocks" | "blocked_by" | "related" | "duplicate">("related");
    const [error, setError] = useState<string | null>(null);

    async function addRelation(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const target = targetIssueIdentifier.trim();
        if (!target) {
            setError(t("issue.chooseIssueToRelate"));
            return;
        }
        if (projectIssues.length > 0 && !projectIssues.some((projectIssue) => projectIssue.identifier.toLowerCase() === target.toLowerCase())) {
            setError(t("issue.chooseIssueFromProject"));
            return;
        }
        setError(null);
        try {
            await onAdd(target, type);
            setTargetIssueIdentifier("");
        } catch (reason) {
            setError(reason instanceof ApiError ? reason.message : t("issue.couldNotAddRelation"));
        }
    }

    return (
        <section className="border-t border-subtle pt-5">
            <SectionTitle title={t("issue.relations")} icon={Link2} />
            <div className="divide-y divide-subtle rounded-lg border border-subtle">
                {relations.map((relation) => (
                    <div
                        key={relation.id}
                        className="flex items-center gap-3 px-3 py-2 text-sm"
                    >
                        <span className="shrink-0 text-xs text-tertiary">{relation.type.replace("_", " ")}</span>
                        <Link
                            to={`/projects/${relation.target.projectId || projectId}/issues/${relation.target.project.issueKey}-${relation.target.number}`}
                            className="flex min-w-0 flex-1 items-center gap-2 hover:text-accent-primary"
                            data-issue-id={relation.target.id}
                            data-issue-context="true"
                            data-project-id={relation.target.projectId || projectId}
                            data-issue-identifier={`${relation.target.project.issueKey}-${relation.target.number}`}
                            data-issue-title={relation.target.title}
                        >
                            <span className="font-mono text-xs text-accent-primary">
                                {relation.target.project.issueKey}-{relation.target.number}
                            </span>
                            <span className="truncate text-primary">{relation.target.title}</span>
                        </Link>
                        <ContextMenuButton
                            entity={{ type: "issue", projectId: relation.target.projectId || projectId, identifier: `${relation.target.project.issueKey}-${relation.target.number}`, title: relation.target.title }}
                            className="mr-1"
                        />
                        <ButtonUtility icon={Trash2} size="xs" color="tertiary" className="text-danger-primary hover:text-danger-secondary" tooltip={t("issue.removeRelation")} onClick={() => onDelete(relation.id)} isDisabled={isPending} />
                    </div>
                ))}
                <form className="flex flex-col gap-2 p-2 sm:flex-row" onSubmit={addRelation}>
                    <ComboBox
                        className="min-w-0 flex-1 sm:min-w-48"
                        items={projectIssues.filter((projectIssue) => projectIssue.id !== issueId).map((projectIssue) => ({ id: projectIssue.identifier, label: `${projectIssue.identifier} · ${projectIssue.title}` }))}
                        selectedKey={targetIssueIdentifier || null}
                        onSelectionChange={(next) => setTargetIssueIdentifier(String(next ?? ""))}
                        placeholder={t("issue.issueIdentifier")}
                        size="sm"
                    >
                        {(item) => <ComboBoxItem item={item}>{item.label}</ComboBoxItem>}
                    </ComboBox>
                    <Select
                        className="sm:w-36"
                        aria-label={t("issue.relationType")}
                        items={[
                            { id: "related", label: t("issue.relatedTo") },
                            { id: "blocks", label: t("issue.blocks") },
                            { id: "blocked_by", label: t("issue.blockedBy") },
                            { id: "duplicate", label: t("issue.duplicateOf") },
                        ]}
                        selectedKey={type}
                        onSelectionChange={(next) => setType((next ?? "related") as typeof type)}
                        size="sm"
                    >
                        {(item) => <Select.Item id={item.id}>{item.label}</Select.Item>}
                    </Select>
                    <Button type="submit" size="xs" iconLeading={Plus} isLoading={isPending}>
                        {t("common.add")}
                    </Button>
                </form>
            </div>
            {error && <p role="alert" className="mt-2 text-xs text-danger-primary">{error}</p>}
        </section>
    );
}

function IssueActivity({ activity, isLoading, isError, columns, members, categories, cycles, projectIssues }: {
    activity: Array<{ id: string; type: string; createdAt: string; actor: { name: string; avatarUrl: string | null }; payload: Record<string, unknown> }>;
    isLoading: boolean;
    isError: boolean;
    columns: Array<{ id: string; name: string }>;
    members: Array<{ id: string; name: string }>;
    categories: Array<{ id: string; name: string }>;
    cycles: Array<{ id: string; name: string }>;
    projectIssues: Array<{ id: string; identifier: string; title: string }>;
}) {
    const { t, i18n } = useTranslation();
    return (
        <section className="pt-4">
            {isLoading ? <div className="space-y-3 py-3" role="status" aria-label={t("issue.loadingActivity")}><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-4/5" /></div>
                : isError ? <p className="py-6 text-center text-sm text-danger-primary" role="alert">{t("issue.couldNotLoadActivity")}</p>
                    : activity.length === 0 ? <p className="py-8 text-center text-sm text-tertiary">{t("issue.noActivity")}</p> : <div className="divide-y divide-subtle">
                {activity.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3 py-3 text-sm text-tertiary">
                        <IssueAvatar name={entry.actor.name} avatarUrl={entry.actor.avatarUrl} className="mt-0.5 size-6 text-xs" />
                        <div className="min-w-0 flex-1"><span className="font-medium text-secondary">{entry.actor.name}</span> <span>{activityLabelKeys[entry.type] ? t(activityLabelKeys[entry.type]) : entry.type}{formatActivityChange(entry.payload, { columns, members, categories, cycles, projectIssues }, t)}</span></div>
                        <time className="shrink-0 text-xs" title={formatFullIssueDate(entry.createdAt, i18n.language)} dateTime={entry.createdAt}>{formatDistanceToNow(entry.createdAt, i18n.language)}</time>
                    </div>
                ))}
            </div>}
        </section>
    );
}

function formatFullIssueDate(value: string, locale: string) {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatActivityChange(payload: Record<string, unknown>, lookups: {
    columns: Array<{ id: string; name: string }>;
    members: Array<{ id: string; name: string }>;
    categories: Array<{ id: string; name: string }>;
    cycles: Array<{ id: string; name: string }>;
    projectIssues: Array<{ id: string; identifier: string; title: string }>;
}, t: ReturnType<typeof useTranslation>["t"]) {
    if (!("from" in payload) && !("to" in payload)) return "";
    const field = String(payload.field ?? "");
    const resolve = (value: unknown) => {
        if (value === null || value === undefined || value === "") return t("issue.noneValue");
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
    isLoading,
    loadFailed,
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
    comments: Array<{ id: string; contentJson: TiptapDocument; authorId: string; author: { name: string; username?: string; avatarUrl: string | null }; createdAt: string; updatedAt: string }>;
    isLoading: boolean;
    loadFailed: boolean;
    currentUserId?: string;
    value: TiptapDocument;
    onChange: (value: TiptapDocument) => void;
    isSubmitting: boolean;
    error?: string | null;
    onSubmit: () => void | Promise<void>;
    onDelete: (id: string) => void | Promise<void>;
    onEdit: (id: string, contentJson: TiptapDocument) => void | Promise<void>;
}) {
    const { t, i18n } = useTranslation();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState<TiptapDocument>(EMPTY_TIPTAP_DOCUMENT);
    return (
        <section className={cx("pt-4", compact && "peek-comments")}>
            <div className="flex flex-col gap-4">
                {isLoading ? <div className="space-y-3" role="status" aria-label={t("issue.loadingComments")}><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
                    : loadFailed ? <p className="py-5 text-center text-sm text-danger-primary" role="alert">{t("issue.couldNotLoadComments")}</p>
                        : comments.length === 0 ? <p className="py-3 text-sm text-tertiary">{t("issue.noComments")}</p> : comments.map((entry) => (
                    <article key={entry.id} className="rounded-lg border border-subtle bg-layer-1/50 p-4">
                        <div className="mb-3 flex items-center gap-3 text-xs text-tertiary">
                            <IssueAvatar name={entry.author.name} avatarUrl={entry.author.avatarUrl} className="size-8 text-xs" />
                            <div className="flex min-w-0 flex-1 flex-col">
                                <span className="truncate font-medium text-secondary">{entry.author.name}{entry.author.username ? <span className="ml-1 font-normal text-tertiary">@{entry.author.username}</span> : null}</span>
                                <time title={formatFullIssueDate(entry.createdAt, i18n.language)} dateTime={entry.createdAt}>{formatDistanceToNow(entry.createdAt, i18n.language)}{new Date(entry.updatedAt).getTime() > new Date(entry.createdAt).getTime() ? ` · ${t("issue.edited")}` : ""}</time>
                            </div>
                        </div>
                        {editingId === entry.id ? (
                            <>
                                <RichTextEditor variant="comment" content={editingContent} onChange={setEditingContent} />
                                <div className="mt-2 flex justify-end gap-2">
                                    <Button size="xs" color="tertiary" onClick={() => setEditingId(null)}>
                                        {t("common.cancel")}
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
                                        {t("common.save")}
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
                                    {t("common.edit")}
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
                                    {t("common.delete")}
                                </button>
                            </div>
                        )}
                    </article>
                ))}
                <div className="rounded-lg border border-subtle bg-layer-1/50">
                    <RichTextEditor toolbar={!compact} variant="comment" content={value} onChange={onChange} onSubmitShortcut={onSubmit} placeholder={t("issue.leaveComment")} />
                    <div className="flex justify-end border-t border-subtle p-2">
                        <Button size="sm" iconLeading={Plus} isDisabled={!hasMeaningfulTiptapContent(value) || isSubmitting} isLoading={isSubmitting} onClick={onSubmit}>
                            {t("issue.commentAction")}
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

function formatDistanceToNow(value: string, locale: string) {
    const minutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000));
    const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    if (minutes < 60) return formatter.format(-minutes, "minute");
    const hours = Math.round(minutes / 60);
    if (hours < 24) return formatter.format(-hours, "hour");
    return formatter.format(-Math.round(hours / 24), "day");
}

function formatDate(value: string, locale: string) {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function hasMeaningfulTiptapContent(document: TiptapDocument) {
    const visit = (nodes: unknown[]): boolean => nodes.some((candidate) => {
        if (!candidate || typeof candidate !== "object") return false;
        const node = candidate as { type?: unknown; text?: unknown; content?: unknown[] };
        if (node.type === "text" && typeof node.text === "string" && node.text.trim().length > 0) return true;
        if (["image", "horizontalRule", "hardBreak", "mention"].includes(String(node.type))) return true;
        return Array.isArray(node.content) && visit(node.content);
    });
    return visit(document.content ?? []);
}

function IssuePeekState({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
    const { t } = useTranslation();
    return <Sheet open onOpenChange={(open) => !open && onClose?.()} title={t("issue.issuePanel")}><div className="flex h-full min-h-0 flex-col">{children}</div></Sheet>;
}

function IssueLoadingSkeleton({ mode }: { mode: "page" | "peek" }) {
    const { t } = useTranslation();
    return (
        <div
            className="flex h-full min-h-0 flex-col"
            role="status"
            aria-label={mode === "peek" ? t("issue.loadingIssue") : t("issue.loadingIssueDetails")}
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

function errorMessage(reason: unknown, fallback: string) {
    if (reason instanceof ApiError) return reason.message;
    return fallback;
}
