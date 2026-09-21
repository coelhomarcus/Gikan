import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Popover } from "@base-ui/react/popover";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { Skeleton } from "@/components/base/feedback/skeleton";
import { Input } from "@/components/base/input/input";
import { ErrorMessage } from "@/components/feedback/error-message";
import { ContextMenuButton } from "@/components/overlay/context-menu-provider";
import { AppearancePicker } from "@/components/appearance/appearance-picker";
import { CoverImage } from "@/components/appearance/cover-image";
import { CoverPicker } from "@/components/appearance/cover-picker";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { type DocumentPage, deleteDocument, getDocument } from "@/features/documents/api";
import { DocumentEditor } from "@/features/documents/components/document-editor";
import { documentKey, documentsKey, useCreateDocument, useDocument, useDocuments } from "@/features/documents/hooks/use-documents";
import { clearDocumentSession, getDocumentSession } from "@/features/documents/sessions";
import { ProjectWorkspaceHeader } from "@/features/projects/components/project-workspace-header";
import { ProjectIcon } from "@/features/projects/components/project-icon";
import { useProjectMembers } from "@/features/projects/hooks/use-project-members";
import { useProjectPermissions } from "@/features/projects/hooks/use-project-permissions";
import { ApiError } from "@/lib/api-client";
import { useTranslation } from "react-i18next";

export function ProjectDocumentsPage() {
    const { projectId = "" } = useParams();
    return <DocumentList key={projectId} projectId={projectId} />;
}

function DocumentList({ projectId }: { projectId: string }) {
    const { t, i18n } = useTranslation();
    const { data: pages, isError } = useDocuments(projectId);
    const create = useCreateDocument(projectId);
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const filtered = pages?.filter((page) => page.title.toLowerCase().includes(search.toLowerCase()));
    async function addPage() {
        try {
            const page = await create.mutateAsync({});
            navigate(`/projects/${projectId}/documents/${page.id}`);
        } catch {
            /* The mutation error is displayed below. */
        }
    }
    return (
        <div className="flex h-full min-h-0 flex-col bg-surface-1">
            <ProjectWorkspaceHeader projectId={projectId} activeView="documents" />
            <main className="min-h-0 flex-1 overflow-y-auto px-5 py-6 lg:px-8">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-display-xs font-semibold text-primary">{t("documents.documents")}</h1>
                        <p className="mt-1 text-sm text-tertiary">{t("documents.pageDescription")}</p>
                    </div>
                    <Button iconLeading={Plus} isLoading={create.isPending} onClick={addPage}>
                        {t("documents.newPage")}
                    </Button>
                </div>
                <div className="mb-4 max-w-xs">
                    <Input aria-label={t("documents.searchPages")} icon={Search} placeholder={`${t("documents.searchPages")}…`} value={search} onChange={setSearch} />
                </div>
                {create.isError && <ErrorMessage message={t("documents.createFailed")} />}
                {isError && <ErrorMessage message={t("documents.loadFailed")} />}
                {!pages && !isError ? (
                    <DocumentSkeleton />
                ) : filtered?.length ? (
                    <div className="divide-y divide-subtle border-y border-subtle">
                        {filtered.map((page) => (
                            <div
                                key={page.id}
                                className="group/page flex min-w-0 items-center rounded px-1 hover:bg-layer-1"
                                data-document-context="true"
                                data-project-id={projectId}
                                data-document-id={page.id}
                                data-document-title={page.title}
                                data-document-author-id={page.createdBy}
                            >
                                <Link
                                    to={`/projects/${projectId}/documents/${page.id}`}
                                    className="flex min-w-0 flex-1 items-center gap-3 px-2 py-4"
                                >
                                    {page.iconAppearance ? <ProjectIcon icon={page.iconAppearance} className="size-5 shrink-0 text-tertiary" /> : <FileText className="size-5 shrink-0 text-tertiary" />}
                                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-primary">{page.title}</span>
                                    <span className="hidden text-xs text-tertiary sm:block">
                                        {t("documents.created", { date: new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" }).format(new Date(page.createdAt)) })}
                                    </span>
                                </Link>
                                <ContextMenuButton
                                    entity={{ type: "document", projectId, documentId: page.id, title: page.title, authorId: page.createdBy }}
                                    className="mr-2 opacity-100 md:opacity-0 md:group-hover/page:opacity-100 md:group-focus-within/page:opacity-100"
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    pages && (
                        <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
                            <FileText className="size-8 text-placeholder" />
                            <h2 className="text-lg font-medium">{search ? t("documents.noPagesFound") : t("documents.startBlank")}</h2>
                            <p className="max-w-sm text-sm text-tertiary">
                                {search ? t("documents.tryDifferentTitle") : t("documents.writeFreely")}
                            </p>
                            {!search && (
                                <Button color="secondary" iconLeading={Plus} isLoading={create.isPending} onClick={addPage}>
                                    {t("documents.createPage")}
                                </Button>
                            )}
                        </div>
                    )
                )}
            </main>
        </div>
    );
}

export function ProjectDocumentPage() {
    const { projectId = "", documentId = "" } = useParams();
    const { t } = useTranslation();
    const { data: page, isError } = useDocument(projectId, documentId);
    const { user } = useAuth();
    return (
        <div className="flex h-full min-h-0 flex-col bg-surface-1">
            <ProjectWorkspaceHeader projectId={projectId} activeView="documents" />
            {isError && page && <ErrorMessage message={t("documents.couldNotRefresh")} />}
            {page && user ? (
                <DocumentWorkspace key={`${user.id}:${projectId}:${documentId}`} page={page} userId={user.id} />
            ) : (
                <main className="flex-1 px-5 py-6 lg:px-8">
                    <Link to={`/projects/${projectId}/documents`} className="mb-5 inline-flex items-center gap-2 text-sm text-tertiary">
                        <ArrowLeft className="size-4" />
                        {t("documents.allPages")}
                    </Link>
                    {isError ? (
                        <ErrorMessage message={t("documents.couldNotLoad")} />
                    ) : (
                        <DocumentSkeleton />
                    )}
                </main>
            )}
        </div>
    );
}

function DocumentWorkspace({ page, userId }: { page: DocumentPage; userId: string }) {
    const { t } = useTranslation();
    const client = useQueryClient();
    const navigate = useNavigate();
    const { isProjectOwner } = useProjectPermissions(page.projectId);
    const { data: members = [] } = useProjectMembers(page.projectId);
    const create = useCreateDocument(page.projectId);
    const session = useMemo(() => getDocumentSession(userId, page, client), [userId, page.id, page.projectId, client]);
    const state = useSyncExternalStore(session.subscribe, session.getSnapshot);
    const [confirm, setConfirm] = useState<"delete" | "discard" | null>(null);
    const [busy, setBusy] = useState(false);
    const [actionError, setActionError] = useState("");
    const [iconPickerOpen, setIconPickerOpen] = useState(false);
    const titleRef = useRef<HTMLTextAreaElement>(null);
    useEffect(() => session.observe(page), [session, page]);
    useEffect(() => {
        const save = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
                event.preventDefault();
                void session.flush();
            }
        };
        window.addEventListener("keydown", save);
        return () => window.removeEventListener("keydown", save);
    }, [session]);
    useEffect(() => {
        const title = titleRef.current;
        if (!title) return;
        const resize = () => {
            title.style.height = "auto";
            title.style.height = `${title.scrollHeight}px`;
        };
        resize();
        let width = title.parentElement!.clientWidth;
        const observer = new ResizeObserver(() => {
            const next = title.parentElement!.clientWidth;
            if (next !== width) {
                width = next;
                resize();
            }
        });
        // Observe the parent width, not the textarea height changed by resize().
        observer.observe(title.parentElement!);
        return () => observer.disconnect();
    }, [state.title, state.status === "loading"]);
    async function confirmAction() {
        setBusy(true);
        setActionError("");
        try {
            if (confirm === "delete") {
                await session.pause();
                await deleteDocument(page.projectId, page.id);
                await clearDocumentSession(userId, page.projectId, page.id);
                await client.cancelQueries({ queryKey: documentKey(page.projectId, page.id) });
                client.removeQueries({ queryKey: documentKey(page.projectId, page.id) });
                void client.invalidateQueries({ queryKey: documentsKey(page.projectId), exact: true });
                navigate(`/projects/${page.projectId}/documents`, { replace: true });
            } else {
                const saved = await getDocument(page.projectId, page.id);
                await session.discard(saved);
                client.setQueryData(documentKey(page.projectId, page.id), saved);
            }
            setConfirm(null);
        } catch (error) {
            session.resume();
            setActionError(error instanceof ApiError ? error.message : t("documents.couldNotComplete"));
        } finally {
            setBusy(false);
        }
    }
    async function copyDraft() {
        setActionError("");
        try {
            const draft = session.getSnapshot();
            const copy = await create.mutateAsync({ title: `${draft.title || t("documents.untitled")} ${t("documents.localCopy")}`.slice(0, 200), contentJson: draft.contentJson, iconAppearance: draft.iconAppearance, cover: draft.cover });
            // The source draft remains intact until the user explicitly opens the saved version.
            navigate(`/projects/${page.projectId}/documents/${copy.id}`);
        } catch (error) {
            setActionError(error instanceof ApiError ? error.message : t("documents.couldNotCopy"));
        }
    }
    const status = {
        loading: t("common.loading"),
        saved: t("documents.saved"),
        pending: t("documents.unsaved"),
        saving: t("documents.saving"),
        offline: t("documents.offline"),
        error: t("documents.saveFailed"),
        conflict: t("documents.resolveChanges"),
        deleted: t("documents.pageDeleted"),
    }[state.status];
    return (
        <>
            <div className="flex shrink-0 items-center justify-between gap-3 px-5 py-3 lg:px-8">
                <Link to={`/projects/${page.projectId}/documents`} className="inline-flex items-center gap-2 text-sm text-tertiary hover:text-primary">
                    <ArrowLeft className="size-4" />
                    {t("documents.allPages")}
                </Link>
                <div className="flex items-center gap-3">
                    <span role="status" aria-live="polite" className="text-xs text-tertiary">
                        {status}
                    </span>
                    {(page.createdBy === userId || isProjectOwner) && (
                        <Button
                            color="tertiary"
                            size="sm"
                            aria-label={t("documents.deletePage")}
                            iconLeading={Trash2}
                            isDisabled={busy}
                            onClick={() => {
                                setActionError("");
                                setConfirm("delete");
                            }}
                        />
                    )}
                </div>
            </div>
            <main data-document-scroll className="document-scroll min-h-0 flex-1 overflow-y-auto">
                {state.status === "loading" ? (
                    <div className="px-5 py-6 lg:px-8">
                        <DocumentSkeleton />
                    </div>
                ) : (
                    <div className="document-writing-surface">
                        {state.storageError && <ErrorMessage message={t(state.storageError as "documents.localDraftUnavailable")} />}
                        {state.status === "error" && (
                            <ErrorMessage message={`${t((state.error || "documents.couldNotSave") as "documents.couldNotSave")} ${t("documents.keepDraft")} ${t("documents.retrySave")}`} />
                        )}
                        {state.status === "offline" && (
                            <p className="mb-4 text-sm text-tertiary">{t("documents.offlineHint")}</p>
                        )}
                        {(state.status === "conflict" || state.status === "deleted") && (
                            <div role="alert" className="mb-5 rounded-md border border-strong bg-layer-1 p-4">
                                <p className="text-sm font-medium">
                                    {state.status === "deleted" ? t("documents.deletedMessage") : t("documents.newerVersion")}
                                </p>
                                <p className="mt-1 text-sm text-tertiary">{t("documents.draftPreserved")}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Button color="secondary" isLoading={create.isPending} onClick={copyDraft}>
                                        {t("documents.createFromDraft")}
                                    </Button>
                                    {state.status === "conflict" && (
                                        <Button
                                            color="tertiary"
                                            onClick={() => {
                                                setActionError("");
                                                setConfirm("discard");
                                            }}
                                        >
                                            {t("documents.openSavedVersion")}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                        {actionError && !confirm && <ErrorMessage message={actionError} />}
                        <div className="mb-3 flex justify-end">
                            <CoverPicker cover={state.cover} disabled={busy || state.status === "deleted"} onChange={(cover) => session.edit({ cover })} />
                        </div>
                        {state.cover && (
                            <div className="document-cover-shell -mx-5 sm:-mx-8 lg:-mx-16">
                                <CoverImage cover={state.cover} className="h-40 sm:h-52" />
                            </div>
                        )}
                        <div className={`relative z-10 mb-5 flex flex-wrap items-end gap-2 ${state.cover ? "-mt-8" : ""}`}>
                            <Popover.Root open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
                                <Popover.Trigger disabled={busy || state.status === "deleted"} aria-label={state.iconAppearance ? t("appearance.changePageIcon") : t("appearance.addPageIcon")} className={`flex items-center justify-center rounded-lg border border-subtle bg-layer-2 text-secondary hover:bg-layer-2-hover ${state.iconAppearance ? "size-16" : "h-8 gap-2 px-2 text-xs font-medium"}`}>
                                    {state.iconAppearance ? <ProjectIcon icon={state.iconAppearance} className="size-9" /> : <><Sparkles className="size-3.5" /> {t("appearance.addPageIcon")}</>}
                                </Popover.Trigger>
                                <Popover.Portal><Popover.Positioner sideOffset={8} collisionPadding={12} className="z-[60]"><Popover.Popup className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-lg border border-subtle bg-layer-2 p-3 shadow-overlay-200 outline-none"><Popover.Title className="sr-only">{t("appearance.pageIcon")}</Popover.Title><AppearancePicker value={state.iconAppearance} onChange={(iconAppearance) => session.edit({ iconAppearance })} onComplete={() => setIconPickerOpen(false)} /></Popover.Popup></Popover.Positioner></Popover.Portal>
                            </Popover.Root>
                        </div>
                        <textarea
                            ref={titleRef}
                            aria-label={t("documents.pageTitle")}
                            rows={1}
                            maxLength={200}
                            value={state.title}
                            placeholder={t("documents.untitled")}
                            className="document-title"
                            disabled={busy || state.status === "deleted"}
                            onChange={(event) => session.edit({ title: event.target.value.replace(/\n/g, " ") })}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    event.currentTarget.parentElement?.querySelector<HTMLElement>('[contenteditable="true"]')?.focus();
                                }
                            }}
                        />
                        <DocumentEditor
                            content={state.contentJson}
                            contentVersion={state.contentVersion}
                            onChange={(contentJson) => session.edit({ contentJson })}
                            members={members}
                            disabled={busy || state.status === "deleted"}
                        />
                    </div>
                )}
            </main>
            <Dialog.Root
                open={!!confirm}
                onOpenChange={(open) => {
                    if (!busy && !open) setConfirm(null);
                }}
            >
                <Dialog.Portal>
                    <Dialog.Backdrop className="fixed inset-0 z-50 bg-backdrop" />
                    <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <Dialog.Popup className="w-full max-w-md rounded-lg border border-subtle bg-layer-2 p-6 shadow-overlay-200">
                            <Dialog.Title className="text-lg font-semibold">
                                {confirm === "delete" ? t("documents.deleteTitle") : t("documents.openSavedTitle")}
                            </Dialog.Title>
                            <Dialog.Description className="mt-2 text-sm text-tertiary">
                                {confirm === "delete"
                                    ? t("documents.deleteWarning")
                                    : t("documents.openSavedWarning")}
                            </Dialog.Description>
                            {actionError && <ErrorMessage message={actionError} />}
                            <div className="mt-6 flex justify-end gap-2">
                                <Button color="secondary" isDisabled={busy} onClick={() => setConfirm(null)}>
                                    {t("common.cancel")}
                                </Button>
                                <Button color={confirm === "delete" ? "primary-destructive" : "primary"} isLoading={busy} onClick={confirmAction}>
                                    {confirm === "delete" ? t("documents.deletePage") : t("documents.openSavedVersion")}
                                </Button>
                            </div>
                        </Dialog.Popup>
                    </Dialog.Viewport>
                </Dialog.Portal>
            </Dialog.Root>
        </>
    );
}

function DocumentSkeleton() {
    const { t } = useTranslation();
    return (
        <div role="status" aria-label={t("documents.loading")} className="space-y-5">
            <Skeleton className="h-8 w-2/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
        </div>
    );
}
