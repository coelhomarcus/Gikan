import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileText, Plus, Search, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { Skeleton } from "@/components/base/feedback/skeleton";
import { Input } from "@/components/base/input/input";
import { ErrorMessage } from "@/components/feedback/error-message";
import { ContextMenuButton } from "@/components/overlay/context-menu-provider";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { type DocumentPage, deleteDocument, getDocument } from "@/features/documents/api";
import { DocumentEditor } from "@/features/documents/components/document-editor";
import { documentKey, documentsKey, useCreateDocument, useDocument, useDocuments } from "@/features/documents/hooks/use-documents";
import { clearDocumentSession, getDocumentSession } from "@/features/documents/sessions";
import { ProjectWorkspaceHeader } from "@/features/projects/components/project-workspace-header";
import { useProjectMembers } from "@/features/projects/hooks/use-project-members";
import { useProjectPermissions } from "@/features/projects/hooks/use-project-permissions";

export function ProjectDocumentsPage() {
    const { projectId = "" } = useParams();
    return <DocumentList key={projectId} projectId={projectId} />;
}

function DocumentList({ projectId }: { projectId: string }) {
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
                        <h1 className="text-display-xs font-semibold text-primary">Documents</h1>
                        <p className="mt-1 text-sm text-tertiary">A place for your project’s ideas, plans, and knowledge.</p>
                    </div>
                    <Button iconLeading={Plus} isLoading={create.isPending} onClick={addPage}>
                        New page
                    </Button>
                </div>
                <div className="mb-4 max-w-xs">
                    <Input aria-label="Search pages" icon={Search} placeholder="Search pages…" value={search} onChange={setSearch} />
                </div>
                {create.isError && <ErrorMessage message="Could not create the page. Please try again." />}
                {isError && <ErrorMessage message="Could not load the pages. Please try again." />}
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
                                    <FileText className="size-5 shrink-0 text-tertiary" />
                                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-primary">{page.title}</span>
                                    <span className="hidden text-xs text-tertiary sm:block">
                                        Created {new Date(page.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
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
                            <h2 className="text-lg font-medium">{search ? "No pages found" : "Start with a blank page"}</h2>
                            <p className="max-w-sm text-sm text-tertiary">
                                {search ? "Try a different title." : "Write freely, organize your thoughts, and share them with your project."}
                            </p>
                            {!search && (
                                <Button color="secondary" iconLeading={Plus} isLoading={create.isPending} onClick={addPage}>
                                    Create a page
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
    const { data: page, isError } = useDocument(projectId, documentId);
    const { user } = useAuth();
    return (
        <div className="flex h-full min-h-0 flex-col bg-surface-1">
            <ProjectWorkspaceHeader projectId={projectId} activeView="documents" />
            {isError && page && <ErrorMessage message="Could not refresh this page. Your local work is still available." />}
            {page && user ? (
                <DocumentWorkspace key={`${user.id}:${projectId}:${documentId}`} page={page} userId={user.id} />
            ) : (
                <main className="flex-1 px-5 py-6 lg:px-8">
                    <Link to={`/projects/${projectId}/documents`} className="mb-5 inline-flex items-center gap-2 text-sm text-tertiary">
                        <ArrowLeft className="size-4" />
                        All pages
                    </Link>
                    {isError ? (
                        <ErrorMessage message="This page could not be loaded. It may have been deleted or you may no longer have access." />
                    ) : (
                        <DocumentSkeleton />
                    )}
                </main>
            )}
        </div>
    );
}

function DocumentWorkspace({ page, userId }: { page: DocumentPage; userId: string }) {
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
            setActionError(error instanceof Error ? error.message : "Could not complete the action.");
        } finally {
            setBusy(false);
        }
    }
    async function copyDraft() {
        setActionError("");
        try {
            const draft = session.getSnapshot();
            const copy = await create.mutateAsync({ title: `${draft.title || "Untitled"} (local copy)`.slice(0, 200), contentJson: draft.contentJson });
            // The source draft remains intact until the user explicitly opens the saved version.
            navigate(`/projects/${page.projectId}/documents/${copy.id}`);
        } catch (error) {
            setActionError(error instanceof Error ? error.message : "Could not create a copy.");
        }
    }
    const status = {
        loading: "Loading…",
        saved: "Saved",
        pending: "Unsaved changes",
        saving: "Saving…",
        offline: "Offline",
        error: "Save failed",
        conflict: "Changes to resolve",
        deleted: "Page deleted",
    }[state.status];
    return (
        <>
            <div className="flex shrink-0 items-center justify-between gap-3 px-5 py-3 lg:px-8">
                <Link to={`/projects/${page.projectId}/documents`} className="inline-flex items-center gap-2 text-sm text-tertiary hover:text-primary">
                    <ArrowLeft className="size-4" />
                    All pages
                </Link>
                <div className="flex items-center gap-3">
                    <span role="status" aria-live="polite" className="text-xs text-tertiary">
                        {status}
                    </span>
                    {(page.createdBy === userId || isProjectOwner) && (
                        <Button
                            color="tertiary"
                            size="sm"
                            aria-label="Delete page"
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
                        {state.storageError && <ErrorMessage message={state.storageError} />}
                        {state.status === "error" && (
                            <ErrorMessage message={`${state.error || "Could not save the page."} Your draft is kept. Press Ctrl/Cmd+S to retry.`} />
                        )}
                        {state.status === "offline" && (
                            <p className="mb-4 text-sm text-tertiary">You’re offline. Your draft is kept on this device and will sync when you reconnect.</p>
                        )}
                        {(state.status === "conflict" || state.status === "deleted") && (
                            <div role="alert" className="mb-5 rounded-md border border-strong bg-layer-1 p-4">
                                <p className="text-sm font-medium">
                                    {state.status === "deleted" ? "This page was deleted." : "A newer version was saved elsewhere."}
                                </p>
                                <p className="mt-1 text-sm text-tertiary">Your local draft is preserved. Create a separate page to keep these changes.</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Button color="secondary" isLoading={create.isPending} onClick={copyDraft}>
                                        Create page from draft
                                    </Button>
                                    {state.status === "conflict" && (
                                        <Button
                                            color="tertiary"
                                            onClick={() => {
                                                setActionError("");
                                                setConfirm("discard");
                                            }}
                                        >
                                            Open saved version
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                        {actionError && !confirm && <ErrorMessage message={actionError} />}
                        <textarea
                            ref={titleRef}
                            aria-label="Page title"
                            rows={1}
                            maxLength={200}
                            value={state.title}
                            placeholder="Untitled"
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
                                {confirm === "delete" ? "Delete this page?" : "Open the saved version?"}
                            </Dialog.Title>
                            <Dialog.Description className="mt-2 text-sm text-tertiary">
                                {confirm === "delete"
                                    ? "This permanently deletes the page and its local draft. This cannot be undone."
                                    : "This replaces your local draft with the saved version. Create a page from your draft first if you want to keep both."}
                            </Dialog.Description>
                            {actionError && <ErrorMessage message={actionError} />}
                            <div className="mt-6 flex justify-end gap-2">
                                <Button color="secondary" isDisabled={busy} onClick={() => setConfirm(null)}>
                                    Cancel
                                </Button>
                                <Button color={confirm === "delete" ? "primary-destructive" : "primary"} isLoading={busy} onClick={confirmAction}>
                                    {confirm === "delete" ? "Delete page" : "Open saved version"}
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
    return (
        <div role="status" aria-label="Loading documents" className="space-y-5">
            <Skeleton className="h-8 w-2/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
        </div>
    );
}
