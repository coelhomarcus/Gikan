import { Dialog } from "@base-ui/react/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, ExternalLink, MoreHorizontal, Settings2, Trash2, type LucideIcon } from "lucide-react";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { useClipboard } from "@/hooks/use-clipboard";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { deleteDocument } from "@/features/documents/api";
import { clearDocumentSession, pauseDocumentSession } from "@/features/documents/sessions";
import { documentKey, documentsKey } from "@/features/documents/hooks/use-documents";
import { useDeleteIssue } from "@/features/issues/hooks/use-issues";
import { fetchIssueClipboardContent } from "@/features/issues/lib/issue-clipboard";
import { DeleteProjectDialog } from "@/features/projects/components/delete-project-dialog";
import { useProjectPermissions } from "@/features/projects/hooks/use-project-permissions";
import { cx } from "@/utils/cx";

export type ProjectContextEntity = { type: "project"; projectId: string; name: string; issueKey: string };
export type IssueContextEntity = { type: "issue"; projectId: string; identifier: string; title: string };
export type DocumentContextEntity = { type: "document"; projectId: string; documentId: string; title: string; authorId: string };
export type ContextMenuEntity = ProjectContextEntity | IssueContextEntity | DocumentContextEntity;

type MenuAnchor = { x: number; y: number; mode: "pointer" | "button"; source: HTMLElement | null };
interface ContextMenuApi {
    open: (entity: ContextMenuEntity, anchor: MenuAnchor) => void;
}
interface MenuState extends MenuAnchor {
    entity: ContextMenuEntity;
}
interface MenuAction {
    key: string;
    label: string;
    icon: LucideIcon;
    destructive?: boolean;
    onSelect: () => void;
}

const ContextMenuContext = createContext<ContextMenuApi>({ open: () => undefined });
const menuClass = "fixed z-[100] max-h-[calc(100dvh-16px)] min-w-56 max-w-[calc(100vw-16px)] overflow-y-auto rounded-lg border border-subtle bg-layer-2 p-1 shadow-overlay-200 outline-none";
const itemClass = "flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-secondary transition duration-100 ease-linear hover:bg-layer-1-hover hover:text-primary focus-visible:bg-layer-1-hover focus-visible:text-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";

/** A mobile action button that opens the same entity menu used by desktop context clicks. */
export function ContextMenuButton({ entity, className }: { entity: ContextMenuEntity; className?: string }) {
    const { open } = useContext(ContextMenuContext);
    const label = entity.type === "project" ? entity.name : entity.type === "issue" ? entity.identifier : entity.title;
    return (
        <button
            type="button"
            aria-label={`More actions for ${label}`}
            data-context-menu-trigger
            data-context-menu-entity={entity.type}
            data-context-menu-project-id={entity.projectId}
            data-context-menu-name={entity.type === "project" ? entity.name : undefined}
            data-context-menu-issue-key={entity.type === "project" ? entity.issueKey : undefined}
            data-context-menu-identifier={entity.type === "issue" ? entity.identifier : undefined}
            data-context-menu-title={entity.type !== "project" ? entity.title : undefined}
            data-context-menu-document-id={entity.type === "document" ? entity.documentId : undefined}
            data-context-menu-author-id={entity.type === "document" ? entity.authorId : undefined}
            className={cx("flex size-8 shrink-0 items-center justify-center rounded-md text-tertiary hover:bg-layer-1-hover hover:text-primary focus-visible:outline-2 focus-visible:outline-accent-strong md:hidden", className)}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                const rect = event.currentTarget.getBoundingClientRect();
                open(entity, { x: rect.right, y: rect.bottom, mode: "button", source: event.currentTarget });
            }}
        >
            <MoreHorizontal aria-hidden="true" className="size-4" />
        </button>
    );
}

export const ContextMenuProvider = ({ children }: { children: ReactNode }) => {
    const [state, setState] = useState<MenuState | null>(null);
    const [confirmation, setConfirmation] = useState<ContextMenuEntity | null>(null);
    const [deletePending, setDeletePending] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
    const [notice, setNotice] = useState("");
    const menuRef = useRef<HTMLDivElement>(null);
    const { copy } = useClipboard();
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const projectId = state?.entity.projectId ?? confirmation?.projectId ?? "";
    const { isProjectOwner, isLoading: permissionsLoading, isError: permissionsError } = useProjectPermissions(projectId);
    const deleteIssue = useDeleteIssue(projectId);

    const open = useCallback((entity: ContextMenuEntity, anchor: MenuAnchor) => {
        setPosition(null);
        setState({ entity, ...anchor });
    }, []);

    useEffect(() => {
        function getEntity(target: HTMLElement | null): { entity: ContextMenuEntity; element: HTMLElement } | null {
            const trigger = target?.closest<HTMLElement>("[data-context-menu-entity]");
            if (trigger?.dataset.contextMenuEntity === "project") {
                return {
                    element: trigger,
                    entity: {
                        type: "project",
                        projectId: trigger.dataset.contextMenuProjectId ?? "",
                        name: trigger.dataset.contextMenuName ?? "Project",
                        issueKey: trigger.dataset.contextMenuIssueKey ?? "",
                    },
                };
            }
            if (trigger?.dataset.contextMenuEntity === "document") {
                return {
                    element: trigger,
                    entity: {
                        type: "document",
                        projectId: trigger.dataset.contextMenuProjectId ?? "",
                        documentId: trigger.dataset.contextMenuDocumentId ?? "",
                        title: trigger.dataset.contextMenuTitle ?? "Untitled",
                        authorId: trigger.dataset.contextMenuAuthorId ?? "",
                    },
                };
            }
            if (trigger?.dataset.contextMenuEntity === "issue") {
                return {
                    element: trigger,
                    entity: {
                        type: "issue",
                        projectId: trigger.dataset.contextMenuProjectId ?? "",
                        identifier: trigger.dataset.contextMenuIdentifier ?? "",
                        title: trigger.dataset.contextMenuTitle ?? "Issue",
                    },
                };
            }
            const element = target?.closest<HTMLElement>("[data-issue-context], [data-project-context], [data-document-context]");
            if (!element) return null;
            const projectId = element.dataset.projectId ?? "";
            if (element.hasAttribute("data-project-context")) {
                return {
                    element,
                    entity: {
                        type: "project",
                        projectId,
                        name: element.dataset.projectName ?? element.textContent?.trim() ?? "Project",
                        issueKey: element.dataset.projectIssueKey ?? "",
                    },
                };
            }
            if (element.hasAttribute("data-document-context")) {
                return {
                    element,
                    entity: {
                        type: "document",
                        projectId,
                        documentId: element.dataset.documentId ?? "",
                        title: element.dataset.documentTitle ?? element.textContent?.trim() ?? "Untitled",
                        authorId: element.dataset.documentAuthorId ?? "",
                    },
                };
            }
            return {
                element,
                entity: {
                    type: "issue",
                    projectId,
                    identifier: element.dataset.issueIdentifier ?? "",
                    title: element.dataset.issueTitle ?? element.textContent?.trim() ?? "Issue",
                },
            };
        }

        function hasNativeEditingContext(target: HTMLElement | null) {
            return Boolean(target?.closest("input, textarea, select, [contenteditable='true'], [role='textbox']"));
        }

        function hasTextSelection(target: HTMLElement | null) {
            const selection = window.getSelection();
            return Boolean(
                target &&
                    selection?.toString().trim() &&
                    target.contains(selection.anchorNode) &&
                    target.contains(selection.focusNode),
            );
        }

        function handleContextMenu(event: MouseEvent) {
            const target = event.target instanceof HTMLElement ? event.target : null;
            if (hasNativeEditingContext(target) || hasTextSelection(target)) return;
            const match = getEntity(target);
            if (!match) return;
            event.preventDefault();
            const source = target?.closest<HTMLElement>("a, button, [tabindex]") ?? match.element;
            open(match.entity, { x: event.clientX, y: event.clientY, mode: "pointer", source });
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (!(event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey))) return;
            const target = event.target instanceof HTMLElement ? event.target : null;
            if (hasNativeEditingContext(target) || hasTextSelection(target)) return;
            const match = getEntity(target);
            if (!match) return;
            event.preventDefault();
            const rect = match.element.getBoundingClientRect();
            open(match.entity, { x: rect.left + 12, y: rect.bottom, mode: "pointer", source: target ?? match.element });
        }

        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("keydown", handleKeyDown, true);
        return () => {
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("keydown", handleKeyDown, true);
        };
    }, [open]);

    const updatePosition = useCallback(() => {
        if (!state || !menuRef.current) return;
        const rect = menuRef.current.getBoundingClientRect();
        const margin = 8;
        const x = Math.max(margin, Math.min(state.mode === "button" ? state.x - rect.width : state.x, window.innerWidth - rect.width - margin));
        const y = Math.max(margin, Math.min(state.y, window.innerHeight - rect.height - margin));
        setPosition((current) => (current?.x === x && current.y === y ? current : { x, y }));
    }, [state]);

    useLayoutEffect(() => {
        if (!state || !menuRef.current) return;
        updatePosition();
        const observer = new ResizeObserver(updatePosition);
        observer.observe(menuRef.current);
        window.addEventListener("resize", updatePosition);
        return () => {
            observer.disconnect();
            window.removeEventListener("resize", updatePosition);
        };
    }, [state, updatePosition]);

    useEffect(() => {
        if (!state) return;
        const focusReturnTarget = state.source;
        menuRef.current?.querySelector<HTMLButtonElement>("[role='menuitem']")?.focus();
        function handlePointerDown(event: PointerEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) setState(null);
        }
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                event.preventDefault();
                setState(null);
                focusReturnTarget?.focus();
                return;
            }
            if (!menuRef.current || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
            const items = [...menuRef.current.querySelectorAll<HTMLButtonElement>("[role='menuitem']:not(:disabled)")];
            if (items.length === 0) return;
            event.preventDefault();
            const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
            const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : event.key === "ArrowDown" ? (currentIndex + 1 + items.length) % items.length : (currentIndex - 1 + items.length) % items.length;
            items[nextIndex]?.focus();
        }
        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [state]);

    useEffect(() => {
        if (!notice) return;
        const timeout = window.setTimeout(() => setNotice(""), 2500);
        return () => window.clearTimeout(timeout);
    }, [notice]);

    const canDeleteProject = Boolean(user && (user.isAdmin || (!permissionsLoading && !permissionsError && isProjectOwner)));
    const canDeleteDocument = Boolean(
        state?.entity.type === "document" && user && (user.isAdmin || state.entity.authorId === user.id || (!permissionsLoading && !permissionsError && isProjectOwner)),
    );

    const actions = useMemo<MenuAction[]>(() => {
        if (!state) return [];
        const { entity } = state;
        const projectUrl = `/projects/${entity.projectId}`;
        const entityUrl = entity.type === "project" ? projectUrl : entity.type === "issue" ? `${projectUrl}/issues/${encodeURIComponent(entity.identifier)}` : `${projectUrl}/documents/${encodeURIComponent(entity.documentId)}`;
        const entityName = entity.type === "project" ? "project" : entity.type === "issue" ? "issue" : "page";
        const openItem: MenuAction = {
            key: "open",
            label: `Open ${entityName}`,
            icon: ExternalLink,
            onSelect: () => navigate(entityUrl, entity.type === "issue" ? { state: { backgroundLocation: location } } : undefined),
        };
        const newTabItem: MenuAction = { key: "new-tab", label: "Open in new tab", icon: ExternalLink, onSelect: () => window.open(entityUrl, "_blank", "noopener,noreferrer") };
        const copyLinkItem: MenuAction = {
            key: "copy-link",
            label: `Copy ${entityName} link`,
            icon: Copy,
            onSelect: () => void copy(`${window.location.origin}${entityUrl}`).then((result) => setNotice(result.success ? "Link copied" : "Could not copy link")),
        };

        if (entity.type === "project") {
            return [
                openItem,
                newTabItem,
                copyLinkItem,
                { key: "settings", label: "Project settings", icon: Settings2, onSelect: () => navigate(`${projectUrl}/settings/general`) },
                ...(canDeleteProject ? [{ key: "delete", label: "Delete project", icon: Trash2, destructive: true, onSelect: () => setConfirmation(entity) }] : []),
            ];
        }
        if (entity.type === "document") {
            return [
                openItem,
                newTabItem,
                copyLinkItem,
                ...(canDeleteDocument ? [{ key: "delete", label: "Delete page", icon: Trash2, destructive: true, onSelect: () => setConfirmation(entity) }] : []),
            ];
        }
        return [
            openItem,
            newTabItem,
            { key: "copy-identifier", label: "Copy issue identifier", icon: Copy, onSelect: () => void copy(entity.identifier).then((result) => setNotice(result.success ? "Issue identifier copied" : "Could not copy identifier")) },
            copyLinkItem,
            {
                key: "copy-content",
                label: "Copy issue content",
                icon: Copy,
                onSelect: () => void fetchIssueClipboardContent(entity.identifier).then(copy).then((result) => setNotice(result.success ? "Issue content copied" : "Could not copy issue content")).catch(() => setNotice("Could not copy issue content")),
            },
            { key: "delete", label: "Delete issue", icon: Trash2, destructive: true, onSelect: () => setConfirmation(entity) },
        ];
    }, [canDeleteDocument, canDeleteProject, copy, navigate, state]);

    async function confirmDelete() {
        if (!confirmation) return;
        setDeletePending(true);
        setDeleteError(null);
        try {
            if (confirmation.type === "issue") {
                await deleteIssue.mutateAsync(confirmation.identifier);
            } else if (confirmation.type === "document") {
                if (!user) throw new Error("Your session has expired. Sign in and try again.");
                const resume = await pauseDocumentSession(user.id, confirmation.projectId, confirmation.documentId);
                try {
                    await deleteDocument(confirmation.projectId, confirmation.documentId);
                } catch (error) {
                    resume?.();
                    throw error;
                }
                await clearDocumentSession(user.id, confirmation.projectId, confirmation.documentId).catch(() => {
                    setNotice("Page deleted, but its local draft could not be cleared.");
                });
                await queryClient.cancelQueries({ queryKey: documentKey(confirmation.projectId, confirmation.documentId) });
                queryClient.removeQueries({ queryKey: documentKey(confirmation.projectId, confirmation.documentId) });
                await queryClient.invalidateQueries({ queryKey: documentsKey(confirmation.projectId), exact: true });
                if (location.pathname.endsWith(`/documents/${confirmation.documentId}`)) {
                    navigate(`/projects/${confirmation.projectId}/documents`, { replace: true });
                }
            }
            setConfirmation(null);
            setDeleteError(null);
        } catch (error) {
            setDeleteError(error instanceof Error ? error.message : "Could not complete the action. Try again.");
        } finally {
            setDeletePending(false);
        }
    }

    function selectAction(action: MenuAction) {
        if (action.key === "delete") setDeleteError(null);
        action.onSelect();
        setState(null);
    }

    return (
        <ContextMenuContext.Provider value={{ open }}>
            {children}
            {state && (
                <div
                    ref={menuRef}
                    role="menu"
                    aria-label={`${state.entity.type} actions`}
                    style={{ left: position?.x ?? Math.max(8, Math.min(state.mode === "button" ? state.x - 224 : state.x, window.innerWidth - 232)), top: position?.y ?? Math.max(8, Math.min(state.y, window.innerHeight - 280)) }}
                    className={menuClass}
                >
                    {actions.map((action, index) => (
                        <FragmentMenuAction key={action.key} action={action} first={index === 0} onSelect={() => selectAction(action)} />
                    ))}
                </div>
            )}
            {notice && <div role="status" aria-live="polite" className="sr-only">{notice}</div>}
            {confirmation?.type === "project" && (
                <DeleteProjectDialog
                    key={confirmation.projectId}
                    project={{ id: confirmation.projectId, name: confirmation.name, issueKey: confirmation.issueKey }}
                    hideTrigger
                    open
                    onOpenChange={(open) => !open && setConfirmation(null)}
                />
            )}
            {confirmation && confirmation.type !== "project" && (
                <Dialog.Root
                    open
                    onOpenChange={(open) => {
                        if (!open && !deletePending) {
                            setConfirmation(null);
                            setDeleteError(null);
                        }
                    }}
                >
                    <Dialog.Portal>
                        <Dialog.Backdrop className="fixed inset-0 z-[110] bg-backdrop" />
                        <Dialog.Viewport className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto p-4">
                            <Dialog.Popup className="w-full max-w-md rounded-lg border border-subtle bg-surface-1 p-6 shadow-overlay-200 outline-none">
                                <Dialog.Title className="text-lg font-semibold text-primary">
                                    {confirmation.type === "issue" ? "Delete issue?" : "Delete page?"}
                                </Dialog.Title>
                                <Dialog.Description className="mt-2 text-sm text-tertiary">
                                    {confirmation.type === "issue"
                                        ? `The issue “${confirmation.identifier}: ${confirmation.title}” will be permanently deleted.`
                                        : `The page “${confirmation.title}” will be permanently deleted, along with its local draft.`}
                                </Dialog.Description>
                                {deleteError && <p role="alert" className="mt-4 text-sm text-danger-primary">{deleteError}</p>}
                                <div className="mt-6 flex justify-end gap-2">
                                    <Button color="secondary" isDisabled={deletePending} onClick={() => setConfirmation(null)}>Cancel</Button>
                                    <Button color="primary-destructive" isLoading={deletePending} onClick={() => void confirmDelete()}>
                                        {confirmation.type === "issue" ? "Delete issue" : "Delete page"}
                                    </Button>
                                </div>
                            </Dialog.Popup>
                        </Dialog.Viewport>
                    </Dialog.Portal>
                </Dialog.Root>
            )}
        </ContextMenuContext.Provider>
    );
};

function FragmentMenuAction({ action, first, onSelect }: { action: MenuAction; first: boolean; onSelect: () => void }) {
    const Icon = action.icon;
    return (
        <>
            {action.destructive && <div role="separator" className="my-1 border-t border-subtle" />}
            <button
                type="button"
                role="menuitem"
                tabIndex={first ? 0 : -1}
                onClick={onSelect}
                className={cx(itemClass, action.destructive && "text-danger-primary hover:text-danger-primary focus-visible:text-danger-primary")}
            >
                <Icon aria-hidden="true" className="size-4 shrink-0 text-placeholder" />
                {action.label}
            </button>
        </>
    );
}
