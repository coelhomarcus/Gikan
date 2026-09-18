import { useEffect, useState } from "react";
import type { TiptapDocument } from "@gikan/shared";
import { Save01 } from "@untitledui/icons";
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

    useEffect(() => {
        if (document) setContent(document.contentJson);
    }, [document]);

    if (isLoading) return <p className="p-6 text-sm text-tertiary">Loading document...</p>;
    if (isError || !document) return <ErrorMessage message="Could not load the project document." />;

    return (
        <div className="flex h-full min-h-0 flex-col bg-primary">
            <ProjectWorkspaceHeader projectId={projectId!} activeView="documents" />
            <main className="mx-auto min-h-0 w-full max-w-4xl flex-1 overflow-y-auto px-4 py-6 lg:px-8">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-tertiary">Project document</p>
                        <h1 className="text-display-xs font-semibold text-primary">Overview notes</h1>
                    </div>
                    <Button size="sm" iconLeading={Save01} isLoading={mutation.isPending} onClick={() => mutation.mutate({ contentJson: content })}>
                        Save
                    </Button>
                </div>
                <div className="rounded-lg border border-secondary bg-primary">
                    <RichTextEditor content={content} onChange={setContent} placeholder="Write the project overview..." />
                </div>
            </main>
        </div>
    );
};
