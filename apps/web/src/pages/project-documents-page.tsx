import { useEffect, useRef, useState } from "react";
import type { TiptapDocument } from "@gikan/shared";
import { Save } from "lucide-react";
import { useBeforeUnload, useParams } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { Skeleton } from "@/components/base/feedback/skeleton";
import { ErrorMessage } from "@/components/feedback/error-message";
import { EMPTY_TIPTAP_DOCUMENT, RichTextEditor } from "@/features/issues/components/rich-text-editor";
import { ProjectWorkspaceHeader } from "@/features/projects/components/project-workspace-header";
import { useProjectDocument, useUpdateProjectDocument } from "@/features/projects/hooks/use-projects";

interface DocumentDraft {
    documentId: string | null;
    content: TiptapDocument;
    version: number;
}

// The SPA keeps unsaved edits per project when switching routes or projects.
const draftsByProject = new Map<string, DocumentDraft>();

export const ProjectDocumentsPage = () => {
    const { projectId = "" } = useParams<{ projectId: string }>();
    return <ProjectDocumentContent key={projectId} projectId={projectId} />;
};

function ProjectDocumentContent({ projectId }: { projectId: string }) {
    const { data: document, isError } = useProjectDocument(projectId);
    const mutation = useUpdateProjectDocument(projectId);
    const cachedDraft = document && draftsByProject.get(projectId)?.documentId === document.id ? draftsByProject.get(projectId) : undefined;
    const [content, setContent] = useState<TiptapDocument>(() => cachedDraft?.content ?? document?.contentJson ?? EMPTY_TIPTAP_DOCUMENT);
    const [isDirty, setIsDirty] = useState(Boolean(cachedDraft));
    const [documentReady, setDocumentReady] = useState(Boolean(document));
    const isDirtyRef = useRef(Boolean(cachedDraft));
    const saveRef = useRef<() => void>(() => undefined);
    const contentVersion = useRef(draftsByProject.get(projectId)?.version ?? 0);

    useBeforeUnload((event) => {
        if (!isDirtyRef.current) return;
        event.preventDefault();
        event.returnValue = "";
    });

    useEffect(() => {
        if (!document) return;
        const draft = draftsByProject.get(projectId);
        if (draft?.documentId === document.id) {
            contentVersion.current = draft.version;
            isDirtyRef.current = true;
            setIsDirty(true);
            setContent(draft.content);
        } else {
            draftsByProject.delete(projectId);
            contentVersion.current = 0;
            isDirtyRef.current = false;
            setIsDirty(false);
            setContent(document.contentJson);
        }
        setDocumentReady(true);
    }, [document, projectId]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "s") return;
            event.preventDefault();
            if (isDirtyRef.current && !mutation.isPending) saveRef.current();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [mutation.isPending]);

    async function save() {
        if (!isDirtyRef.current || mutation.isPending || !document) return;
        const saveVersion = contentVersion.current;
        const savedContent = content;
        try {
            await mutation.mutateAsync({ contentJson: savedContent });
            const latestDraft = draftsByProject.get(projectId);
            if (latestDraft?.version === saveVersion) {
                draftsByProject.delete(projectId);
                isDirtyRef.current = false;
                setIsDirty(false);
            }
        } catch {
            // The mutation state keeps the local save error visible; the draft stays available to retry.
        }
    }

    function changeContent(nextContent: TiptapDocument) {
        if (!document) return;
        const version = contentVersion.current + 1;
        contentVersion.current = version;
        isDirtyRef.current = true;
        draftsByProject.set(projectId, { documentId: document.id, content: nextContent, version });
        setIsDirty(true);
        setContent(nextContent);
    }

    saveRef.current = save;

    return (
        <div className="flex h-full min-h-0 flex-col bg-surface-1">
            <ProjectWorkspaceHeader projectId={projectId} activeView="documents" />
            <main className="flex min-h-0 w-full flex-1 flex-col overflow-hidden px-4 pt-5 lg:px-8">
                {isError && !document ? (
                    <ErrorMessage message="Could not load the project document." />
                ) : !documentReady || !document ? (
                    <DocumentSkeleton />
                ) : (
                    <>
                        {isError && <ErrorMessage message="Could not refresh the project document." />}
                        <div className="mb-4 flex shrink-0 items-end justify-between gap-4">
                            <div className="min-w-0">
                                <p className="text-sm text-tertiary">Project document</p>
                                <h1 className="text-display-xs truncate font-semibold text-primary">Overview notes</h1>
                            </div>
                            <div className="flex shrink-0 items-center gap-3">
                                <span className={mutation.isError ? "text-xs text-danger-primary" : "text-xs text-tertiary"}>
                                    {mutation.isPending ? "Saving..." : mutation.isError ? "Save failed" : isDirty ? "Unsaved changes" : "Saved"}
                                </span>
                                <Button size="sm" iconLeading={Save} isDisabled={!isDirty} isLoading={mutation.isPending} onClick={save}>
                                    Save
                                </Button>
                            </div>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto border-t border-subtle">
                            <RichTextEditor
                                variant="document"
                                className="h-full min-h-full"
                                content={content}
                                onChange={changeContent}
                                placeholder="Write the project overview..."
                            />
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

function DocumentSkeleton() {
    return (
        <div role="status" aria-label="Loading project document" aria-live="polite">
            <div className="mb-4 flex items-end justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-6 w-40" />
                </div>
                <Skeleton className="h-7 w-16" />
            </div>
            <div className="min-h-0 flex-1 space-y-4 border-t border-subtle py-6">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="mt-8 h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
        </div>
    );
}
