import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import { EditorView, placeholder } from "@codemirror/view";
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
    { label: "Título", icon: Heading01, snippet: "# Novo título\n\n" },
    { label: "Texto", icon: Type01, snippet: "Novo bloco de texto\n\n" },
    { label: "Lista", icon: ListIcon, snippet: "- Item\n- Item\n\n" },
    { label: "Tarefa", icon: CheckSquare, snippet: "- [ ] Tarefa\n\n" },
    { label: "Código", icon: Code01, snippet: "```\n\n```\n\n", cursorOffset: 4 },
    { label: "Citação", icon: Annotation, snippet: "> Nota\n\n" },
];

const editorTheme = EditorView.theme({
    "&": {
        height: "100%",
        backgroundColor: "transparent",
        color: "var(--color-text-secondary)",
        fontSize: "0.875rem",
    },
    ".cm-scroller": {
        overflow: "auto",
        fontFamily: "var(--font-mono)",
        lineHeight: "1.5",
        padding: "1.25rem",
    },
    ".cm-content": {
        minHeight: "100%",
        padding: "0",
    },
    ".cm-line": {
        padding: "0",
    },
    ".cm-gutters": {
        display: "none",
    },
    ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: "var(--color-fg-brand-primary)",
    },
    "&.cm-focused": {
        outline: "none",
    },
    ".cm-selectionBackground, ::selection": {
        backgroundColor: "var(--color-bg-brand-primary_alt)",
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
                    EditorView.lineWrapping,
                    placeholder("Escreva ideias, decisões, links, tarefas..."),
                    EditorView.contentAttributes.of({ "aria-label": "Conteúdo da página" }),
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

    return <div ref={containerRef} className="min-h-0 flex-1 overflow-hidden" aria-label="Conteúdo da página em Markdown" />;
};

interface RenderedPageProps {
    content: string;
}

const RenderedPage: FC<RenderedPageProps> = ({ content }) => {
    return (
        <article aria-label="Conteúdo da página renderizado" className="prose min-h-0 max-w-none flex-1 overflow-y-auto px-5 py-5 text-sm">
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
                    setErrorMessage(error instanceof ApiError ? error.message : "Não foi possível salvar a página.");
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

    const statusLabel =
        saveState === "saving" ? "Salvando..." : saveState === "error" ? "Erro ao salvar" : hasUnsavedChanges ? "Alterações pendentes" : "Salvo";

    return (
        <div className="flex h-dvh min-h-0 flex-col overflow-hidden">
            <ProjectWorkspaceHeader projectId={projectId!} activeView="page" />

            <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
                {isLoading && <p className="text-tertiary">Carregando...</p>}

                {isError && <ErrorMessage message="Não foi possível carregar a página do projeto." />}

                {!isLoading && !isError && project && (
                    <div className="mx-auto flex h-full min-h-0 max-w-7xl flex-col gap-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-tertiary">Página do projeto</p>
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
                                    Salvar
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
                                        Cru
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setViewMode("rendered")}
                                        className={cx(
                                            "rounded-md px-3 py-1 text-sm font-medium transition duration-100 ease-linear",
                                            viewMode === "rendered" ? "bg-primary text-primary shadow-xs" : "text-tertiary hover:text-secondary",
                                        )}
                                    >
                                        Renderizado
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
