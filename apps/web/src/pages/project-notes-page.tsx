import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
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
type ViewMode = "raw" | "rendered";

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

const HEADING_CLASS_BY_LEVEL: Record<1 | 2 | 3, string> = {
    1: "text-display-xs",
    2: "text-xl",
    3: "text-lg",
};

function buildBlockElement(block: PreviewBlock): HTMLElement {
    if (block.type === "heading") {
        const el = document.createElement(`h${block.level}`);
        el.dataset.block = "heading";
        el.dataset.level = String(block.level);
        el.textContent = block.text;
        el.className = cx("font-semibold text-primary outline-none", HEADING_CLASS_BY_LEVEL[block.level]);
        return el;
    }

    if (block.type === "checklist") {
        const ul = document.createElement("ul");
        ul.dataset.block = "checklist";
        ul.className = "flex flex-col gap-2";

        for (const item of block.items) {
            const li = document.createElement("li");
            li.className = "flex items-start gap-2 text-sm text-secondary";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = item.checked;
            checkbox.className = "mt-0.5 size-4 shrink-0 rounded border-secondary accent-current";

            const span = document.createElement("span");
            span.textContent = item.text || " ";

            li.append(checkbox, span);
            ul.appendChild(li);
        }

        return ul;
    }

    if (block.type === "list") {
        const ul = document.createElement("ul");
        ul.dataset.block = "list";
        ul.className = "list-disc space-y-1 pl-5 text-sm text-secondary";

        for (const item of block.items) {
            const li = document.createElement("li");
            li.textContent = item;
            ul.appendChild(li);
        }

        return ul;
    }

    if (block.type === "quote") {
        const blockquote = document.createElement("blockquote");
        blockquote.dataset.block = "quote";
        blockquote.className = "border-l-2 border-brand pl-4 text-sm text-tertiary";

        for (const line of block.lines.length > 0 ? block.lines : [""]) {
            const p = document.createElement("p");
            p.textContent = line;
            blockquote.appendChild(p);
        }

        return blockquote;
    }

    if (block.type === "code") {
        const pre = document.createElement("pre");
        pre.dataset.block = "code";
        pre.dataset.language = block.language ?? "";
        pre.className = "overflow-x-auto rounded-lg bg-secondary p-4 text-sm text-primary ring-1 ring-secondary";

        const code = document.createElement("code");
        code.className = "font-mono whitespace-pre-wrap";
        code.textContent = block.code;

        pre.appendChild(code);
        return pre;
    }

    const p = document.createElement("p");
    p.dataset.block = "paragraph";
    p.className = "text-sm leading-6 whitespace-pre-wrap text-secondary";
    p.textContent = block.text;
    return p;
}

function renderMarkdownIntoElement(container: HTMLElement, content: string) {
    const blocks = parsePageBlocks(content);
    const elements = blocks.length > 0 ? blocks.map(buildBlockElement) : [buildBlockElement({ type: "paragraph", text: "" })];
    container.replaceChildren(...elements);
}

function domBlockToMarkdown(el: Element): string {
    const type = (el as HTMLElement).dataset.block;

    if (type === "heading") {
        const level = Number((el as HTMLElement).dataset.level ?? "1");
        return `${"#".repeat(level)} ${el.textContent?.trim() ?? ""}`;
    }

    if (type === "checklist") {
        const items = Array.from(el.querySelectorAll("li")).map((li) => {
            const checkbox = li.querySelector("input[type='checkbox']") as HTMLInputElement | null;
            const text = (li.querySelector("span")?.textContent ?? li.textContent ?? "").trim();
            return `- [${checkbox?.checked ? "x" : " "}] ${text}`;
        });
        return items.join("\n");
    }

    if (type === "list") {
        const items = Array.from(el.querySelectorAll("li")).map((li) => `- ${li.textContent?.trim() ?? ""}`);
        return items.join("\n");
    }

    if (type === "quote") {
        const paragraphs = Array.from(el.querySelectorAll("p"));
        const lines = paragraphs.length > 0 ? paragraphs.map((p) => `> ${p.textContent ?? ""}`) : [`> ${el.textContent ?? ""}`];
        return lines.join("\n");
    }

    if (type === "code") {
        const code = el.querySelector("code");
        const language = (el as HTMLElement).dataset.language ?? "";
        return "```" + language + "\n" + (code?.textContent ?? "") + "\n```";
    }

    return el.textContent ?? "";
}

function serializeElementToMarkdown(container: HTMLElement): string {
    return Array.from(container.children)
        .map((child) => domBlockToMarkdown(child))
        .join("\n\n");
}

interface RenderedPageEditorProps {
    content: string;
    onChange: (value: string) => void;
}

const RenderedPageEditor: FC<RenderedPageEditorProps> = ({ content, onChange }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const lastSyncedContentRef = useRef<string | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        if (document.activeElement && container.contains(document.activeElement)) return;
        if (lastSyncedContentRef.current === content) return;

        renderMarkdownIntoElement(container, content);
        lastSyncedContentRef.current = content;
    }, [content]);

    function syncFromDom() {
        const container = containerRef.current;
        if (!container) return;

        const markdown = serializeElementToMarkdown(container);
        lastSyncedContentRef.current = markdown;
        onChange(markdown);
    }

    return (
        <div
            ref={containerRef}
            role="textbox"
            aria-multiline="true"
            aria-label="Conteúdo da página (renderizado)"
            contentEditable
            suppressContentEditableWarning
            onInput={syncFromDom}
            onBlur={syncFromDom}
            onClick={(event) => {
                const target = event.target as HTMLElement;
                if (target.matches("input[type='checkbox']")) {
                    window.requestAnimationFrame(syncFromDom);
                }
            }}
            className="h-full min-h-[500px] flex-1 overflow-y-auto px-5 py-5 text-sm leading-6 outline-none [&>*+*]:mt-4"
        />
    );
};

export const ProjectNotesPage = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { data: project, isLoading, isError } = useProject(projectId!);
    const mutation = useUpdateProjectPage(projectId!);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
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

                        <section className="flex min-h-[560px] flex-1 flex-col overflow-hidden rounded-lg border border-secondary bg-primary">
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
                                <TextArea
                                    aria-label="Conteúdo da página"
                                    value={content}
                                    onChange={handleContentChange}
                                    textAreaRef={textAreaRef}
                                    placeholder="Escreva ideias, decisões, links, tarefas..."
                                    className="min-h-0 flex-1 gap-0"
                                    textAreaClassName="h-full min-h-[500px] resize-none rounded-none border-0 px-5 py-5 font-mono text-sm leading-6 shadow-none ring-0 focus:ring-0"
                                />
                            ) : (
                                <RenderedPageEditor content={content} onChange={handleContentChange} />
                            )}
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
};
