import { useEffect, useRef, useState } from "react";
import type { TiptapDocument } from "@gikan/shared";
import { Save } from "lucide-react";
import { useParams } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { ErrorMessage } from "@/components/feedback/error-message";
import { EMPTY_TIPTAP_DOCUMENT, RichTextEditor } from "@/features/issues/components/rich-text-editor";
import { ProjectWorkspaceHeader } from "@/features/projects/components/project-workspace-header";
import { useProjectDocument, useUpdateProjectDocument } from "@/features/projects/hooks/use-projects";

export const ProjectDocumentsPage = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { data: document, isLoading, isError } = useProjectDocument(projectId!);
    const mutation = useUpdateProjectDocument(projectId!);
    const [content, setContent] = useState<TiptapDocument>(EMPTY_TIPTAP_DOCUMENT);
    const [isDirty, setIsDirty] = useState(false);
    const isDirtyRef = useRef(false);
    const loadedDocumentId = useRef<string | null>(null);

    useEffect(() => {
        if (!document || isDirtyRef.current) return;
        if (loadedDocumentId.current !== document.id) {
            loadedDocumentId.current = document.id;
            setContent(document.contentJson);
        }
    }, [document]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "s") return;
            event.preventDefault();
            if (isDirtyRef.current && !mutation.isPending) save();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    });

    function save() {
        mutation.mutate(
            { contentJson: content },
            {
                onSuccess: () => {
                    isDirtyRef.current = false;
                    setIsDirty(false);
                },
            },
        );
    }

    if (isLoading) return <p className="p-6 text-sm text-tertiary">Loading document...</p>;
    if (isError || !document) return <ErrorMessage message="Could not load the project document." />;

    return (
        <div className="flex h-full min-h-0 flex-col bg-primary">
            <ProjectWorkspaceHeader projectId={projectId!} activeView="documents" />
            <main className="mx-auto min-h-0 w-full max-w-4xl flex-1 overflow-y-auto px-4 py-6 lg:px-8">
                <div className="mb-4 flex items-end justify-between gap-4">
                    <div>
                        <p className="text-sm text-tertiary">Project document</p>
                        <h1 className="text-display-xs font-semibold text-primary">Overview notes</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={mutation.isError ? "text-xs text-error-primary" : "text-xs text-tertiary"}>
                            {mutation.isPending ? "Saving..." : mutation.isError ? "Save failed" : isDirty ? "Unsaved changes" : "Saved"}
                        </span>
                        <Button size="sm" iconLeading={Save} isDisabled={!isDirty} isLoading={mutation.isPending} onClick={save}>
                            Save
                        </Button>
                    </div>
                </div>
                <div className="rounded-lg border border-secondary bg-primary">
                    <RichTextEditor
                        content={content}
                        onChange={(nextContent) => {
                            isDirtyRef.current = true;
                            setIsDirty(true);
                            setContent(nextContent);
                        }}
                        placeholder="Write the project overview..."
                    />
                </div>
            </main>
        </div>
    );
};
