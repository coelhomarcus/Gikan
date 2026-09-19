import { flushSync } from "react-dom";
import { autoUpdate, computePosition, flip, offset, shift, size } from "@floating-ui/dom";
import { PluginKey } from "@tiptap/pm/state";
import type { Editor } from "@tiptap/react";
import type { SuggestionProps } from "@tiptap/suggestion";
import { exitSuggestion } from "@tiptap/suggestion";
import { type Root, createRoot } from "react-dom/client";

export const documentSlashKey = new PluginKey("document-slash");
export const documentMentionKey = new PluginKey("document-mention");
export interface EditorCommand {
    id: string;
    label: string;
    detail?: string;
    run?: (editor: Editor) => void;
}
export const blockCommands: EditorCommand[] = [
    {
        id: "text",
        label: "Text",
        detail: "Plain paragraph",
        run: (e) => {
            e.chain().focus().setParagraph().run();
        },
    },
    ...([1, 2, 3] as const).map((level) => ({
        id: `heading-${level}`,
        label: `Heading ${level}`,
        detail: "Section heading",
        run: (e: Editor) => {
            e.chain().focus().setHeading({ level }).run();
        },
    })),
    {
        id: "bullet",
        label: "Bullet list",
        run: (e) => {
            e.chain().focus().toggleBulletList().run();
        },
    },
    {
        id: "numbered",
        label: "Numbered list",
        run: (e) => {
            e.chain().focus().toggleOrderedList().run();
        },
    },
    {
        id: "task",
        label: "To-do list",
        run: (e) => {
            e.chain().focus().toggleTaskList().run();
        },
    },
    {
        id: "quote",
        label: "Quote",
        run: (e) => {
            e.chain().focus().toggleBlockquote().run();
        },
    },
    {
        id: "code",
        label: "Code block",
        run: (e) => {
            e.chain().focus().toggleCodeBlock().run();
        },
    },
    {
        id: "divider",
        label: "Divider",
        run: (e) => {
            e.chain().focus().setHorizontalRule().run();
        },
    },
    {
        id: "image",
        label: "Image",
        detail: "Insert an image URL",
        run: (e) => {
            e.chain().focus().setImage({ src: "", alt: "" }).run();
        },
    },
    {
        id: "table",
        label: "Table",
        detail: "3 × 3 with a header row",
        run: (e) => {
            e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        },
    },
];

/** Floating UI owns geometry; the portal is outside the document's scrolling surface. */
export function documentSuggestions(pluginKey: PluginKey) {
    let element: HTMLDivElement | undefined, root: Root | undefined, cleanup: (() => void) | undefined;
    let props: SuggestionProps<EditorCommand> | undefined;
    let index = 0;
    const render = () => {
        if (!props || !root) return;
        const current = props;
        flushSync(() =>
            root!.render(
                <div role="listbox" aria-label="Editor commands" className="document-command-list">
                    {current.items.length === 0 && <p className="px-3 py-3 text-sm text-tertiary">No results</p>}
                    {current.items.map((item, i) => (
                        <button
                            key={item.id}
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
                            <span>{item.label}</span>
                            {item.detail && <span className="text-xs text-tertiary">{item.detail}</span>}
                        </button>
                    ))}
                </div>,
            ),
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
            props = next;
            index = 0;
            element = document.createElement("div");
            element.className = "document-suggestions";
            // If this editor is later used inside a dialog, keep its popup in the active focus scope.
            (next.editor.view.dom.closest('[role="dialog"]') ?? document.body).append(element);
            root = createRoot(element);
            render();
            cleanup = autoUpdate(next.editor.view.dom, element, position);
            window.visualViewport?.addEventListener("resize", position);
        },
        onUpdate(next: SuggestionProps<EditorCommand>) {
            props = next;
            index = Math.min(index, Math.max(0, next.items.length - 1));
            render();
            position();
        },
        onKeyDown({ event }: { event: KeyboardEvent }) {
            if (!props) return false;
            if (event.key === "Escape") {
                exitSuggestion(props.editor.view, pluginKey);
                return true;
            }
            if (["ArrowDown", "ArrowUp"].includes(event.key)) {
                index = (index + (event.key === "ArrowDown" ? 1 : -1) + props.items.length) % Math.max(1, props.items.length);
                render();
                return true;
            }
            if (event.key === "Enter" && props.items[index]) {
                props.command(props.items[index]);
                return true;
            }
            return false;
        },
        onExit() {
            cleanup?.();
            window.visualViewport?.removeEventListener("resize", position);
            const previousRoot = root;
            queueMicrotask(() => previousRoot?.unmount());
            element?.remove();
            props = undefined;
            root = undefined;
            element = undefined;
        },
    };
}
