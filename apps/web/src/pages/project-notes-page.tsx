import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { EditorView, placeholder } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { Annotation, CheckCircle, CheckSquare, Code01, Heading01, List as ListIcon, Save01, Type01 } from "@untitledui/icons";
import { basicSetup } from "codemirror";
import ReactMarkdown from "react-markdown";
import { useParams } from "react-router";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/base/buttons/button";
import { ErrorMessage } from "@/components/feedback/error-message";
import { ProjectWorkspaceHeader } from "@/features/projects/components/project-workspace-header";
import { useProject } from "@/features/projects/hooks/use-project";
import { useUpdateProjectPage } from "@/features/projects/hooks/use-projects";
import { ApiError } from "@/lib/api-client";
import { cx } from "@/utils/cx";

type SaveState = "saved" | "dirty" | "saving" | "error";
type ViewMode = "raw" | "rendered";

interface BlockCommand {
    label: string;
    icon: FC<{ className?: string }>;
    snippet: string;
    cursorOffset?: number;
}

const BLOCK_COMMANDS: BlockCommand[] = [
    { label: "Heading", icon: Heading01, snippet: "# New heading\n\n" },
    { label: "Text", icon: Type01, snippet: "New text block\n\n" },
    { label: "List", icon: ListIcon, snippet: "- Item\n- Item\n\n" },
    { label: "Task", icon: CheckSquare, snippet: "- [ ] Task\n\n" },
    { label: "Code", icon: Code01, snippet: "```\n\n```\n\n", cursorOffset: 4 },
    { label: "Quote", icon: Annotation, snippet: "> Note\n\n" },
];

// Tokyo Night-inspired palette tuned for the app's nearly black surfaces.
const editorHighlightStyle = HighlightStyle.define([
    { tag: tags.heading, color: "#7dcfff", fontWeight: "700" },
    { tag: tags.heading1, color: "#bb9af7", fontSize: "1.2em" },
    { tag: tags.heading2, color: "#7dcfff", fontSize: "1.1em" },
    { tag: [tags.heading3, tags.heading4, tags.heading5, tags.heading6], color: "#73daca" },
    { tag: tags.strong, color: "#ff9e64", fontWeight: "700" },
    { tag: tags.emphasis, color: "#f7768e", fontStyle: "italic" },
    { tag: [tags.link, tags.url], color: "#7aa2f7", textDecoration: "underline" },
    { tag: tags.quote, color: "#9ece6a", fontStyle: "italic" },
    { tag: tags.list, color: "#bb9af7" },
    { tag: tags.monospace, color: "#e0af68", backgroundColor: "#1a1b26" },
    { tag: tags.comment, color: "#565f89" },
    { tag: tags.contentSeparator, color: "#565f89" },
    { tag: tags.invalid, color: "#f7768e", textDecoration: "underline wavy" },
]);

const editorTheme = EditorView.theme({
    "&": {
        height: "100%",
        backgroundColor: "#0f111a",
        color: "#c0caf5",
        fontSize: "0.875rem",
    },
    ".cm-scroller": {
        overflow: "auto",
        fontFamily: "var(--font-mono)",
        lineHeight: "1.5",
        padding: "1.5rem",
    },
    ".cm-content": {
        minHeight: "100%",
        padding: "0",
    },
    ".cm-line": {
        padding: "0.08rem 0",
    },
    ".cm-gutters": {
        display: "none",
    },
    ".cm-activeLine": {
        backgroundColor: "#161a2b",
    },
    ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: "#7dcfff",
    },
    "&.cm-focused": {
        outline: "none",
    },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection": {
        backgroundColor: "#33467c",
    },
    ".cm-matchingBracket": {
        backgroundColor: "#33467c",
        outline: "1px solid #7dcfff",
    },
    ".cm-placeholder": {
        color: "#565f89",
        fontStyle: "italic",
    },
});

interface MarkdownEditorProps {
    content: string;
    onChange: (value: string) => void;
    editorViewRef: { current: EditorView | null };
}

const MarkdownEditor: FC<MarkdownEditorProps> = ({ content, onChange, editorViewRef }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const view = new EditorView({
            state: EditorState.create({
                doc: content,
                extensions: [
                    basicSetup,
                    markdown({ base: markdownLanguage }),
                    syntaxHighlighting(editorHighlightStyle),
                    EditorView.lineWrapping,
                    placeholder("Write ideas, decisions, links, tasks..."),
                    EditorView.contentAttributes.of({ "aria-label": "Page content" }),
                    editorTheme,
                    EditorView.updateListener.of((update) => {
                        if (update.docChanged) {
                            onChangeRef.current(update.state.doc.toString());
                        }
                    }),
                ],
            }),
            parent: container,
        });

        editorViewRef.current = view;

        return () => {
            editorViewRef.current = null;
            view.destroy();
        };
    }, [editorViewRef]);

    useEffect(() => {
        const view = editorViewRef.current;
        if (!view || view.state.doc.toString() === content) return;

        view.dispatch({
            changes: {
                from: 0,
                to: view.state.doc.length,
                insert: content,
            },
        });
    }, [content, editorViewRef]);

    return <div ref={containerRef} className="min-h-0 flex-1 overflow-hidden" aria-label="Page content in Markdown" />;
};

interface RenderedPageProps {
    content: string;
}

const RenderedPage: FC<RenderedPageProps> = ({ content }) => {
    return (
        <article aria-label="Rendered page content" className="prose min-h-0 max-w-none flex-1 overflow-y-auto px-5 py-5 text-sm">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                skipHtml
                components={{
                    input: ({ type, ...props }) => (
                        <input {...props} type={type ?? "checkbox"} disabled className="mt-0.5 size-4 rounded border-secondary accent-current" />
                    ),
                }}
            >
                {content || " "}
            </ReactMarkdown>
        </article>
    );
};

export const ProjectNotesPage = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { data: project, isLoading, isError } = useProject(projectId!);
    const mutation = useUpdateProjectPage(projectId!);
    const editorViewRef = useRef<EditorView | null>(null);
    const hydratedProjectIdRef = useRef<string | null>(null);
    const lastSavedContentRef = useRef("");
    const contentRef = useRef("");
    const [content, setContent] = useState("");
    const [viewMode, setViewMode] = useState<ViewMode>("raw");
    const [saveState, setSaveState] = useState<SaveState>("saved");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const hasUnsavedChanges = content !== lastSavedContentRef.current;

    useEffect(() => {
        contentRef.current = content;
    }, [content]);

    useEffect(() => {
        if (!project || hydratedProjectIdRef.current === project.id) return;

        const initialContent = project.pageContent ?? "";
        hydratedProjectIdRef.current = project.id;
        lastSavedContentRef.current = initialContent;
        contentRef.current = initialContent;
        setContent(initialContent);
        setSaveState("saved");
        setErrorMessage(null);
    }, [project]);

    function handleContentChange(value: string) {
        setContent(value);
        setErrorMessage(null);
        setSaveState(value === lastSavedContentRef.current ? "saved" : "dirty");
    }

    function commitContent(nextContent = content) {
        if (!project || nextContent === lastSavedContentRef.current || mutation.isPending) {
            return;
        }

        setSaveState("saving");
        mutation.mutate(
            { pageContent: nextContent },
            {
                onSuccess: (updatedProject) => {
                    lastSavedContentRef.current = updatedProject.pageContent;
                    setSaveState(contentRef.current === updatedProject.pageContent ? "saved" : "dirty");
                },
                onError: (error) => {
                    setSaveState("error");
                    setErrorMessage(error instanceof ApiError ? error.message : "Could not save the page.");
                },
            },
        );
    }

    useEffect(() => {
        if (!project || !hasUnsavedChanges || mutation.isPending || saveState === "error") return;

        const timeout = window.setTimeout(() => commitContent(content), 1000);
        return () => window.clearTimeout(timeout);
    }, [content, hasUnsavedChanges, mutation.isPending, project, saveState]);

    useEffect(() => {
        function handleKeyDown(event: KeyboardEvent) {
            const isSaveShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s";
            if (!isSaveShortcut) return;

            event.preventDefault();
            commitContent(contentRef.current);
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [project, mutation.isPending]);

    function insertBlock(command: BlockCommand) {
        const view = editorViewRef.current;
        const editorContent = view?.state.doc.toString() ?? content;
        const selection = view?.state.selection.main;
        const selectionStart = selection?.from ?? editorContent.length;
        const selectionEnd = selection?.to ?? editorContent.length;
        const needsBreakBefore = selectionStart > 0 && editorContent[selectionStart - 1] !== "\n";
        const prefix = needsBreakBefore ? "\n\n" : "";
        const insertedText = `${prefix}${command.snippet}`;
        const nextContent = `${editorContent.slice(0, selectionStart)}${insertedText}${editorContent.slice(selectionEnd)}`;
        const cursorPosition = selectionStart + prefix.length + (command.cursorOffset ?? command.snippet.length);

        if (view) {
            view.dispatch({
                changes: { from: selectionStart, to: selectionEnd, insert: insertedText },
                selection: { anchor: cursorPosition },
            });
            view.focus();
        } else {
            handleContentChange(nextContent);
        }
    }

    const statusLabel = saveState === "saving" ? "Saving..." : saveState === "error" ? "Save failed" : hasUnsavedChanges ? "Unsaved changes" : "Saved";

    return (
        <div className="flex h-dvh min-h-0 flex-col overflow-hidden">
            <ProjectWorkspaceHeader projectId={projectId!} activeView="page" />

            <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
                {isLoading && <p className="text-tertiary">Loading...</p>}

                {isError && <ErrorMessage message="Could not load the project page." />}

                {!isLoading && !isError && project && (
                    <div className="mx-auto flex h-full min-h-0 max-w-7xl flex-col gap-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-tertiary">Project page</p>
                                <h1 className="truncate text-display-xs font-semibold text-primary">{project.name}</h1>
                            </div>

                            <div className="flex items-center gap-3">
                                <span
                                    className={cx(
                                        "inline-flex items-center gap-1.5 text-sm",
                                        saveState === "error" ? "text-error-primary" : hasUnsavedChanges ? "text-warning-primary" : "text-success-primary",
                                    )}
                                >
                                    {!hasUnsavedChanges && saveState === "saved" && <CheckCircle className="size-4 shrink-0" />}
                                    {statusLabel}
                                </span>
                                <Button
                                    size="sm"
                                    iconLeading={Save01}
                                    isLoading={mutation.isPending}
                                    isDisabled={!hasUnsavedChanges || mutation.isPending}
                                    onClick={() => commitContent()}
                                >
                                    Save
                                </Button>
                            </div>
                        </div>

                        {errorMessage && <p className="text-sm text-error-primary">{errorMessage}</p>}

                        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-secondary bg-primary">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-secondary p-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    {viewMode === "raw" &&
                                        BLOCK_COMMANDS.map((command) => (
                                            <Button
                                                key={command.label}
                                                size="xs"
                                                color="secondary"
                                                iconLeading={command.icon}
                                                onClick={() => insertBlock(command)}
                                            >
                                                {command.label}
                                            </Button>
                                        ))}
                                </div>

                                <div className="inline-flex items-center rounded-lg bg-secondary p-0.5">
                                    <button
                                        type="button"
                                        onClick={() => setViewMode("raw")}
                                        className={cx(
                                            "rounded-md px-3 py-1 text-sm font-medium transition duration-100 ease-linear",
                                            viewMode === "raw" ? "bg-primary text-primary shadow-xs" : "text-tertiary hover:text-secondary",
                                        )}
                                    >
                                        Raw
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode("rendered")}
                                        className={cx(
                                            "rounded-md px-3 py-1 text-sm font-medium transition duration-100 ease-linear",
                                            viewMode === "rendered" ? "bg-primary text-primary shadow-xs" : "text-tertiary hover:text-secondary",
                                        )}
                                    >
                                        Rendered
                                    </button>
                                </div>
                            </div>

                            {viewMode === "raw" ? (
                                <MarkdownEditor content={content} onChange={handleContentChange} editorViewRef={editorViewRef} />
                            ) : (
                                <RenderedPage content={content} />
                            )}
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
};
