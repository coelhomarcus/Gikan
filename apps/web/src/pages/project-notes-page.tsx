import type { FC, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Annotation, CheckCircle, CheckSquare, Code01, Heading01, List as ListIcon, Save01, Type01 } from "@untitledui/icons";
import { useParams } from "react-router";
import { Button } from "@/components/base/buttons/button";
import { TextArea } from "@/components/base/textarea/textarea";
import { ErrorMessage } from "@/components/feedback/error-message";
import { ProjectWorkspaceHeader } from "@/features/projects/components/project-workspace-header";
import { useProject } from "@/features/projects/hooks/use-project";
import { useUpdateProjectPage } from "@/features/projects/hooks/use-projects";
import { ApiError } from "@/lib/api-client";
import { cx } from "@/utils/cx";

type SaveState = "saved" | "dirty" | "saving" | "error";

interface BlockCommand {
    label: string;
    icon: FC<{ className?: string }>;
    snippet: string;
    cursorOffset?: number;
}

type PreviewBlock =
    | { type: "heading"; level: 1 | 2 | 3; text: string }
    | { type: "paragraph"; text: string }
    | { type: "quote"; lines: string[] }
    | { type: "list"; items: string[] }
    | { type: "checklist"; items: Array<{ checked: boolean; text: string }> }
    | { type: "code"; code: string; language?: string };

const BLOCK_COMMANDS: BlockCommand[] = [
    { label: "Título", icon: Heading01, snippet: "# Novo título\n\n" },
    { label: "Texto", icon: Type01, snippet: "Novo bloco de texto\n\n" },
    { label: "Lista", icon: ListIcon, snippet: "- Item\n- Item\n\n" },
    { label: "Tarefa", icon: CheckSquare, snippet: "- [ ] Tarefa\n\n" },
    { label: "Código", icon: Code01, snippet: "```\n\n```\n\n", cursorOffset: 4 },
    { label: "Citação", icon: Annotation, snippet: "> Nota\n\n" },
];

const checklistRegex = /^-\s+\[( |x|X)\]\s+(.+)$/;
const listRegex = /^[-*]\s+(.+)$/;
const headingRegex = /^(#{1,3})\s+(.+)$/;

function isChecklistLine(line: string) {
    return checklistRegex.test(line.trim());
}

function isListLine(line: string) {
    return listRegex.test(line.trim()) && !isChecklistLine(line);
}

function isQuoteLine(line: string) {
    return line.trim().startsWith(">");
}

function isCodeFence(line: string) {
    return line.trim().startsWith("```");
}

function isHeadingLine(line: string) {
    return headingRegex.test(line.trim());
}

function isSpecialLine(line: string) {
    return isCodeFence(line) || isHeadingLine(line) || isChecklistLine(line) || isListLine(line) || isQuoteLine(line);
}

function parsePageBlocks(content: string): PreviewBlock[] {
    const blocks: PreviewBlock[] = [];
    const lines = content.split("\n");
    let index = 0;

    while (index < lines.length) {
        const line = lines[index];
        const trimmed = line.trim();

        if (!trimmed) {
            index += 1;
            continue;
        }

        if (isCodeFence(line)) {
            const language = trimmed.slice(3).trim() || undefined;
            const codeLines: string[] = [];
            index += 1;

            while (index < lines.length && !isCodeFence(lines[index])) {
                codeLines.push(lines[index]);
                index += 1;
            }

            if (index < lines.length) {
                index += 1;
            }

            blocks.push({ type: "code", code: codeLines.join("\n"), language });
            continue;
        }

        const heading = trimmed.match(headingRegex);
        if (heading) {
            blocks.push({ type: "heading", level: heading[1].length as 1 | 2 | 3, text: heading[2] });
            index += 1;
            continue;
        }

        if (isChecklistLine(line)) {
            const items: Array<{ checked: boolean; text: string }> = [];
            while (index < lines.length && isChecklistLine(lines[index])) {
                const match = lines[index].trim().match(checklistRegex);
                if (match) {
                    items.push({ checked: match[1].toLowerCase() === "x", text: match[2] });
                }
                index += 1;
            }
            blocks.push({ type: "checklist", items });
            continue;
        }

        if (isListLine(line)) {
            const items: string[] = [];
            while (index < lines.length && isListLine(lines[index])) {
                const match = lines[index].trim().match(listRegex);
                if (match) {
                    items.push(match[1]);
                }
                index += 1;
            }
            blocks.push({ type: "list", items });
            continue;
        }

        if (isQuoteLine(line)) {
            const quoteLines: string[] = [];
            while (index < lines.length && isQuoteLine(lines[index])) {
                quoteLines.push(lines[index].trim().replace(/^>\s?/, ""));
                index += 1;
            }
            blocks.push({ type: "quote", lines: quoteLines });
            continue;
        }

        const paragraphLines: string[] = [];
        while (index < lines.length && lines[index].trim() && !isSpecialLine(lines[index])) {
            paragraphLines.push(lines[index].trim());
            index += 1;
        }
        blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
    }

    return blocks;
}

function renderPreviewBlock(block: PreviewBlock, index: number): ReactNode {
    if (block.type === "heading") {
        const HeadingTag = `h${block.level}` as "h1" | "h2" | "h3";
        return (
            <HeadingTag
                key={index}
                className={cx(
                    "font-semibold text-primary",
                    block.level === 1 && "text-display-xs",
                    block.level === 2 && "text-xl",
                    block.level === 3 && "text-lg",
                )}
            >
                {block.text}
            </HeadingTag>
        );
    }

    if (block.type === "checklist") {
        return (
            <ul key={index} className="flex flex-col gap-2">
                {block.items.map((item, itemIndex) => (
                    <li key={`${item.text}-${itemIndex}`} className="flex items-start gap-2 text-sm text-secondary">
                        <input type="checkbox" checked={item.checked} readOnly className="mt-0.5 size-4 rounded border-secondary accent-current" />
                        <span className={cx(item.checked && "text-tertiary line-through")}>{item.text}</span>
                    </li>
                ))}
            </ul>
        );
    }

    if (block.type === "list") {
        return (
            <ul key={index} className="list-disc space-y-1 pl-5 text-sm text-secondary">
                {block.items.map((item, itemIndex) => (
                    <li key={`${item}-${itemIndex}`}>{item}</li>
                ))}
            </ul>
        );
    }

    if (block.type === "quote") {
        return (
            <blockquote key={index} className="border-l-2 border-brand pl-4 text-sm text-tertiary">
                {block.lines.map((line, lineIndex) => (
                    <p key={`${line}-${lineIndex}`}>{line}</p>
                ))}
            </blockquote>
        );
    }

    if (block.type === "code") {
        return (
            <pre key={index} className="overflow-x-auto rounded-lg bg-secondary p-4 text-sm text-primary ring-1 ring-secondary">
                {block.language && <div className="mb-2 text-xs font-medium text-tertiary">{block.language}</div>}
                <code className="font-mono whitespace-pre">{block.code}</code>
            </pre>
        );
    }

    return (
        <p key={index} className="text-sm leading-6 whitespace-pre-wrap text-secondary">
            {block.text}
        </p>
    );
}

export const ProjectNotesPage = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { data: project, isLoading, isError } = useProject(projectId!);
    const mutation = useUpdateProjectPage(projectId!);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const hydratedProjectIdRef = useRef<string | null>(null);
    const lastSavedContentRef = useRef("");
    const contentRef = useRef("");
    const [content, setContent] = useState("");
    const [saveState, setSaveState] = useState<SaveState>("saved");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const previewBlocks = useMemo(() => parsePageBlocks(content), [content]);
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

    function insertBlock(command: BlockCommand) {
        const textarea = textAreaRef.current;
        const selectionStart = textarea?.selectionStart ?? content.length;
        const selectionEnd = textarea?.selectionEnd ?? content.length;
        const needsBreakBefore = selectionStart > 0 && content[selectionStart - 1] !== "\n";
        const prefix = needsBreakBefore ? "\n\n" : "";
        const nextContent = `${content.slice(0, selectionStart)}${prefix}${command.snippet}${content.slice(selectionEnd)}`;
        const cursorPosition = selectionStart + prefix.length + (command.cursorOffset ?? command.snippet.length);

        handleContentChange(nextContent);
        window.requestAnimationFrame(() => {
            textarea?.focus();
            textarea?.setSelectionRange(cursorPosition, cursorPosition);
        });
    }

    const statusLabel =
        saveState === "saving"
            ? "Salvando..."
            : saveState === "error"
              ? "Erro ao salvar"
              : hasUnsavedChanges
                ? "Alterações pendentes"
                : "Salvo";

    return (
        <div className="flex h-dvh flex-col">
            <ProjectWorkspaceHeader projectId={projectId!} activeView="page" />

            <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
                {isLoading && <p className="text-tertiary">Carregando...</p>}

                {isError && <ErrorMessage message="Não foi possível carregar a página do projeto." />}

                {!isLoading && !isError && project && (
                    <div className="mx-auto flex min-h-full max-w-7xl flex-col gap-4">
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

                        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)]">
                            <section className="flex min-h-[560px] flex-col overflow-hidden rounded-lg border border-secondary bg-primary">
                                <div className="flex flex-wrap items-center gap-2 border-b border-secondary p-3">
                                    {BLOCK_COMMANDS.map((command) => (
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

                                <TextArea
                                    aria-label="Conteúdo da página"
                                    value={content}
                                    onChange={handleContentChange}
                                    textAreaRef={textAreaRef}
                                    placeholder="Escreva ideias, decisões, links, tarefas..."
                                    className="min-h-0 flex-1 gap-0"
                                    textAreaClassName="h-full min-h-[500px] resize-none rounded-none border-0 px-5 py-5 font-mono text-sm leading-6 shadow-none ring-0 focus:ring-0"
                                />
                            </section>

                            <aside className="flex min-h-[560px] flex-col overflow-hidden rounded-lg border border-secondary bg-primary">
                                <div className="border-b border-secondary px-5 py-3">
                                    <p className="text-sm font-semibold text-secondary">Preview</p>
                                </div>
                                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                                    {previewBlocks.length > 0 ? (
                                        <div className="flex flex-col gap-4">{previewBlocks.map(renderPreviewBlock)}</div>
                                    ) : (
                                        <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-secondary text-sm text-tertiary">
                                            Página em branco
                                        </div>
                                    )}
                                </div>
                            </aside>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
