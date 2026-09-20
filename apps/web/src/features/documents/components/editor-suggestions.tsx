import { autoUpdate, computePosition, flip, offset, shift, size } from "@floating-ui/dom";
import { PluginKey } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/react";
import type { SuggestionProps } from "@tiptap/suggestion";
import { exitSuggestion } from "@tiptap/suggestion";
import {
    Code2,
    Heading1,
    Heading2,
    Heading3,
    Image as ImageIcon,
    List,
    ListChecks,
    ListOrdered,
    type LucideIcon,
    Minus,
    Quote,
    Table2,
    Type,
} from "lucide-react";
import { type Root, createRoot } from "react-dom/client";
import i18n from "@/i18n/i18n";
import type { TranslationKey } from "@/i18n/resources";

export const documentSlashKey = new PluginKey("document-slash");
export const documentMentionKey = new PluginKey("document-mention");
export interface EditorCommand {
    id: string;
    label: string;
    detail?: string;
    group?: string;
    aliases?: string[];
    run?: (editor: Editor, range: { from: number; to: number }) => void;
}
export const blockCommands: EditorCommand[] = [
    {
        id: "text",
        label: "Text",
        detail: "Plain paragraph",
        group: "Text",
        aliases: ["paragraph", "plain"],
        run: (e, range) => e.chain().focus().deleteRange(range).setParagraph().run(),
    },
    ...([1, 2, 3] as const).map((level) => ({
        id: `heading-${level}`,
        label: `Heading ${level}`,
        detail: "Section heading",
        group: "Text",
        aliases: [`h${level}`, `heading${level}`],
        run: (e: Editor, range: { from: number; to: number }) => e.chain().focus().deleteRange(range).setHeading({ level }).run(),
    })),
    {
        id: "bullet",
        label: "Bullet list",
        detail: "Unordered list",
        group: "Lists",
        aliases: ["bullets", "unordered", "ul"],
        run: (e, range) => e.chain().focus().deleteRange(range).toggleBulletList().run(),
    },
    {
        id: "numbered",
        label: "Numbered list",
        detail: "Ordered list",
        group: "Lists",
        aliases: ["ordered", "number", "ol"],
        run: (e, range) => e.chain().focus().deleteRange(range).toggleOrderedList().run(),
    },
    {
        id: "task",
        label: "To-do list",
        detail: "Checklist",
        group: "Lists",
        aliases: ["todo", "task list", "checklist"],
        run: (e, range) => e.chain().focus().deleteRange(range).toggleTaskList().run(),
    },
    {
        id: "quote",
        label: "Quote",
        detail: "Block quote",
        group: "Blocks",
        aliases: ["blockquote", "citation"],
        run: (e, range) => e.chain().focus().deleteRange(range).toggleBlockquote().run(),
    },
    {
        id: "code",
        label: "Code block",
        detail: "Preformatted text",
        group: "Blocks",
        aliases: ["pre", "codeblock"],
        run: (e, range) => e.chain().focus().deleteRange(range).toggleCodeBlock().run(),
    },
    {
        id: "divider",
        label: "Divider",
        detail: "Horizontal rule",
        group: "Blocks",
        aliases: ["horizontal rule", "hr", "separator"],
        run: (e, range) => e.chain().focus().deleteRange(range).setHorizontalRule().run(),
    },
    {
        id: "image",
        label: "Image",
        detail: "Insert an image URL",
        group: "Media",
        aliases: ["img", "picture", "photo"],
        run: (e, range) => e.chain().focus().deleteRange(range).setImage({ src: "", alt: "" }).run(),
    },
    {
        id: "table",
        label: "Table",
        detail: "3 × 3 with a header row",
        group: "Media",
        aliases: ["grid"],
        run: (e, range) => e.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
];

export function filterBlockCommands(query: string) {
    const normalizedQuery = query.trim().toLowerCase();
    const localized = blockCommands.map(localizeCommand);
    if (!normalizedQuery) return localized;
    return localized.filter((item, index) => [item.label, item.detail, blockCommands[index].label, blockCommands[index].detail, ...(item.aliases ?? [])].filter(Boolean).join(" ").toLowerCase().includes(normalizedQuery));
}

const commandKeys: Record<string, [TranslationKey, TranslationKey, TranslationKey]> = {
    text: ["editor.text", "editor.paragraph", "editor.blocks"],
    "heading-1": ["editor.heading", "editor.sectionHeading", "editor.blocks"],
    "heading-2": ["editor.heading", "editor.sectionHeading", "editor.blocks"],
    "heading-3": ["editor.heading", "editor.sectionHeading", "editor.blocks"],
    bullet: ["editor.bulletList", "editor.unorderedList", "editor.lists"],
    numbered: ["editor.numberedList", "editor.orderedList", "editor.lists"],
    task: ["editor.todoList", "editor.checklist", "editor.lists"],
    quote: ["editor.quote", "editor.blockquote", "editor.blocks"],
    code: ["editor.codeBlock", "editor.preformatted", "editor.blocks"],
    divider: ["editor.divider", "editor.horizontalRule", "editor.blocks"],
    image: ["editor.image", "editor.insertImageUrl", "editor.media"],
    table: ["editor.table", "editor.tableDimensions", "editor.media"],
};

function localizeCommand(item: EditorCommand): EditorCommand {
    const keys = commandKeys[item.id];
    if (!keys) return item;
    const headingLevel = item.id.startsWith("heading-") ? Number(item.id.slice(-1)) : undefined;
    const translate = (key: TranslationKey, options?: Record<string, string | number>) => i18n.t(key as string, options) as string;
    const label = headingLevel ? translate(keys[0], { level: headingLevel }) : translate(keys[0]);
    return { ...item, label, detail: translate(keys[1]), group: translate(keys[2]) };
}

export function executeBlockCommand(editor: Editor, item: EditorCommand, range: { from: number; to: number }) {
    const { selection, doc } = editor.state;
    if (editor.isDestroyed || !selection.empty || range.from < 0 || range.to < range.from || range.to > doc.content.size) return;
    if (selection.from !== range.to || !doc.textBetween(range.from, range.to, "\n", "\n").startsWith("/")) return;
    item.run?.(editor, range);
}

const commandIcons: Record<string, LucideIcon> = {
    text: Type,
    "heading-1": Heading1,
    "heading-2": Heading2,
    "heading-3": Heading3,
    bullet: List,
    numbered: ListOrdered,
    task: ListChecks,
    quote: Quote,
    code: Code2,
    divider: Minus,
    image: ImageIcon,
    table: Table2,
};

/** Floating UI owns geometry; the portal is outside the document's scrolling surface. */
export function documentSuggestions(pluginKey: PluginKey) {
    let element: HTMLDivElement | undefined, root: Root | undefined, cleanup: (() => void) | undefined;
    let removeTransactionListener: (() => void) | undefined;
    let props: SuggestionProps<EditorCommand> | undefined;
    let index = 0;
    let lastQuery = "";
    let generation = 0;
    const currentProps = (next: SuggestionProps<EditorCommand>) => {
        if (pluginKey !== documentSlashKey) return next;
        const live = pluginKey.getState(next.editor.state);
        if (!live?.active) return next;
        return {
            ...next,
            range: live.range,
            query: live.query ?? "",
            text: live.text ?? "",
            items: filterBlockCommands(live.query ?? ""),
            clientRect: () => {
                if (next.editor.isDestroyed) return null;
                try {
                    const { left, top, right, bottom } = next.editor.view.coordsAtPos(next.editor.state.selection.from);
                    return new DOMRect(left, top, right - left, bottom - top);
                } catch {
                    return null;
                }
            },
            command: (item: EditorCommand) => {
                const current = pluginKey.getState(next.editor.state);
                if (current?.active) executeBlockCommand(next.editor, item, current.range);
            },
        };
    };
    const render = () => {
        if (!props || !root) return;
        const current = props;
        const list = current.items;
        const t = i18n.getFixedT(null, "translation");
        root.render(
            <div role="listbox" aria-label={t(pluginKey === documentMentionKey ? "editor.mentions" : "editor.commands")} className="document-command-list">
                {list.length === 0 && <p className="px-3 py-3 text-sm text-tertiary">{t("editor.noResults")}</p>}
                {list.map((item, i) => {
                    const Icon = commandIcons[item.id];
                    const previous = list[i - 1];
                    return (
                        <div key={item.id}>
                            {item.group && item.group !== previous?.group && <p className="document-command-group">{item.group}</p>}
                            <button
                                type="button"
                                role="option"
                                aria-selected={index === i}
                                className={`document-command ${index === i ? "bg-layer-2-hover" : ""}`}
                                onPointerMove={() => {
                                    if (index !== i) {
                                        index = i;
                                        render();
                                    }
                                }}
                                onMouseDown={(event) => {
                                    event.preventDefault();
                                    current.command(item);
                                }}
                            >
                                <span className="document-command-heading">
                                    {Icon && <Icon aria-hidden="true" className="size-4 shrink-0 text-tertiary" />}
                                    <span>{item.label}</span>
                                </span>
                                {item.detail && <span className="document-command-detail">{item.detail}</span>}
                            </button>
                        </div>
                    );
                })}
            </div>,
        );
        const selected = element?.querySelector<HTMLElement>('[aria-selected="true"]');
        if (element && selected) {
            if (selected.offsetTop < element.scrollTop) element.scrollTop = selected.offsetTop;
            else if (selected.offsetTop + selected.offsetHeight > element.scrollTop + element.clientHeight)
                element.scrollTop = selected.offsetTop + selected.offsetHeight - element.clientHeight;
        }
    };
    const position = () => {
        const rect = props?.clientRect?.();
        if (!rect || !element) return;
        const popup = element;
        const bounds = props!.editor.view.dom.closest("[data-document-scroll]")?.getBoundingClientRect();
        if (bounds && (rect.bottom < bounds.top || rect.top > bounds.bottom)) {
            popup.style.visibility = "hidden";
            return;
        }
        void computePosition({ getBoundingClientRect: () => rect, contextElement: props!.editor.view.dom }, popup, {
            strategy: "fixed",
            placement: "bottom-start",
            middleware: [
                offset(8),
                flip({ padding: 12 }),
                shift({ padding: 12 }),
                size({
                    padding: 12,
                    apply({ availableHeight, availableWidth, elements }) {
                        Object.assign(elements.floating.style, {
                            maxHeight: `${Math.max(0, Math.min(360, availableHeight))}px`,
                            maxWidth: `${Math.max(0, availableWidth)}px`,
                        });
                    },
                }),
            ],
        }).then(({ x, y }) => {
            if (popup.isConnected) Object.assign(popup.style, { left: `${x}px`, top: `${y}px`, visibility: "visible" });
        });
    };
    return {
        onStart(next: SuggestionProps<EditorCommand>) {
            removeTransactionListener?.();
            cleanup?.();
            if (root) {
                root.unmount();
                element?.remove();
            }
            generation++;
            props = currentProps(next);
            index = 0;
            lastQuery = props.query;
            element = document.createElement("div");
            element.className = "document-suggestions";
            // If this editor is later used inside a dialog, keep its popup in the active focus scope.
            (next.editor.view.dom.closest('[role="dialog"]') ?? document.body).append(element);
            root = createRoot(element);
            render();
            cleanup = autoUpdate(next.editor.view.dom, element, position);
            window.visualViewport?.addEventListener("resize", position);
            if (pluginKey === documentSlashKey) {
                const syncLiveSlash = () => {
                    if (!props) return;
                    const live = pluginKey.getState(next.editor.state);
                    if (!live?.active) return;
                    const updated = currentProps(props);
                    if (updated.query === props.query && updated.range.from === props.range.from && updated.range.to === props.range.to) return;
                    if (updated.query !== lastQuery) {
                        lastQuery = updated.query;
                        index = 0;
                    }
                    props = updated;
                    index = Math.min(index, Math.max(0, props.items.length - 1));
                    render();
                    position();
                };
                next.editor.on("transaction", syncLiveSlash);
                removeTransactionListener = () => {
                    next.editor.off("transaction", syncLiveSlash);
                };
            }
        },
        onUpdate(next: SuggestionProps<EditorCommand>) {
            props = currentProps(next);
            if (lastQuery !== props.query) {
                lastQuery = props.query;
                index = 0;
            }
            index = Math.min(index, Math.max(0, props.items.length - 1));
            render();
            position();
        },
        onKeyDown({ event }: { event: KeyboardEvent }) {
            if (!props) return false;
            if (event.key === "Escape") {
                exitSuggestion(props.editor.view, pluginKey);
                return true;
            }
            if (["ArrowDown", "ArrowUp"].includes(event.key) && props.items.length > 0) {
                index = (index + (event.key === "ArrowDown" ? 1 : -1) + props.items.length) % Math.max(1, props.items.length);
                render();
                return true;
            }
            if (event.key === "Tab" && props.items[index]) {
                event.preventDefault();
                props.command(props.items[index]);
                return true;
            }
            if (event.key === "Enter" && props.items[index]) {
                props.command(props.items[index]);
                return true;
            }
            return false;
        },
        onExit(next: SuggestionProps<EditorCommand>) {
            const exitingGeneration = generation;
            queueMicrotask(() => {
                // Tiptap 3 view updates are async. A stale stop may arrive after a
                // newer transaction has already reactivated this suggestion.
                if (exitingGeneration !== generation || (!next.editor.isDestroyed && pluginKey.getState(next.editor.state)?.active)) return;
                removeTransactionListener?.();
                removeTransactionListener = undefined;
                cleanup?.();
                window.visualViewport?.removeEventListener("resize", position);
                const previousRoot = root;
                element?.remove();
                props = undefined;
                root = undefined;
                element = undefined;
                lastQuery = "";
                previousRoot?.unmount();
            });
        },
    };
}
