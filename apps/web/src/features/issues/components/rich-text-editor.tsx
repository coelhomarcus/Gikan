import { useEffect, useMemo, useRef, useState } from "react";
import type { TiptapDocument } from "@gikan/shared";
import { Bold, Check, CheckSquare, Code2, Heading2, Italic, Link2, List, Quote, X } from "lucide-react";
import Link from "@tiptap/extension-link";
import Mention from "@tiptap/extension-mention";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { cx } from "@/utils/cx";

export const EMPTY_TIPTAP_DOCUMENT: TiptapDocument = { type: "doc", content: [] };

interface MentionItem {
    id: string;
    label: string;
    description?: string;
}

function createMentionSuggestion(items: MentionItem[]) {
    return {
        items: ({ query }: { query: string }) =>
            items.filter((item) => `${item.label} ${item.description ?? ""}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8),
        render: () => {
            let popup: HTMLDivElement | null = null;
            let currentItems: MentionItem[] = [];
            let selectedIndex = 0;

            const renderItems = (props: { items: MentionItem[]; command: (item: MentionItem) => void; clientRect?: (() => DOMRect | null) | null }) => {
                currentItems = props.items;
                selectedIndex = Math.min(selectedIndex, Math.max(0, currentItems.length - 1));
                if (!popup) {
                    popup = document.createElement("div");
                    popup.className = "fixed z-50 min-w-52 overflow-hidden rounded-lg border border-secondary bg-primary p-1 shadow-xl";
                    document.body.appendChild(popup);
                }
                popup.replaceChildren(
                    ...currentItems.map((item, index) => {
                        const button = document.createElement("button");
                        button.type = "button";
                        button.className = `flex w-full flex-col rounded-md px-3 py-2 text-left ${index === selectedIndex ? "bg-secondary" : ""}`;
                        const label = document.createElement("span");
                        label.className = "text-sm font-medium text-primary";
                        label.textContent = `@${item.label}`;
                        button.appendChild(label);
                        if (item.description) {
                            const description = document.createElement("span");
                            description.className = "text-xs text-tertiary";
                            description.textContent = item.description;
                            button.appendChild(description);
                        }
                        button.addEventListener("mousedown", (event) => {
                            event.preventDefault();
                            props.command(item);
                        });
                        return button;
                    }),
                );
                const rect = props.clientRect?.();
                if (rect && popup) {
                    popup.style.left = `${rect.left}px`;
                    popup.style.top = `${rect.bottom + 6}px`;
                }
            };

            return {
                onStart: renderItems,
                onUpdate: renderItems,
                onKeyDown: (props: { event: KeyboardEvent }) => {
                    if (!popup || currentItems.length === 0) return false;
                    if (props.event.key === "ArrowDown") {
                        selectedIndex = (selectedIndex + 1) % currentItems.length;
                        return true;
                    }
                    if (props.event.key === "ArrowUp") {
                        selectedIndex = (selectedIndex + currentItems.length - 1) % currentItems.length;
                        return true;
                    }
                    return false;
                },
                onExit: () => {
                    popup?.remove();
                    popup = null;
                },
            };
        },
    };
}

interface RichTextEditorProps {
    content: TiptapDocument;
    editable?: boolean;
    onChange?: (content: TiptapDocument) => void;
    placeholder?: string;
    mentionItems?: MentionItem[];
    className?: string;
    onSubmitShortcut?: () => void;
}

export const RichTextEditor = ({
    content,
    editable = true,
    onChange,
    placeholder = "Write something...",
    mentionItems = [],
    className,
    onSubmitShortcut,
}: RichTextEditorProps) => {
    const mentionSuggestion = useMemo(() => createMentionSuggestion(mentionItems), [mentionItems]);
    const contentRef = useRef(content);
    const onChangeRef = useRef(onChange);
    const onSubmitShortcutRef = useRef(onSubmitShortcut);
    const syncingRef = useRef(false);
    onChangeRef.current = onChange;
    onSubmitShortcutRef.current = onSubmitShortcut;
    const editor = useEditor({
        immediatelyRender: false,
        editable,
        content,
        editorProps: {
            handleKeyDown: (_view, event) => {
                if (onSubmitShortcutRef.current && (event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    event.preventDefault();
                    onSubmitShortcutRef.current();
                    return true;
                }
                return false;
            },
        },
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: false }),
            Link.configure({ openOnClick: !editable, autolink: true }),
            TaskList,
            TaskItem.configure({ nested: true }),
            Placeholder.configure({ placeholder }),
            Mention.configure({ HTMLAttributes: { class: "mention" }, suggestion: mentionSuggestion }),
        ],
        onUpdate: ({ editor: currentEditor }) => {
            if (syncingRef.current) return;
            const nextContent = currentEditor.getJSON() as TiptapDocument;
            if (JSON.stringify(nextContent) === JSON.stringify(contentRef.current)) return;
            contentRef.current = nextContent;
            onChangeRef.current?.(nextContent);
        },
    });

    useEffect(() => {
        if (!editor) return;
        contentRef.current = content;
        syncingRef.current = true;
        if (editor.isEditable !== editable) editor.setEditable(editable);
        if (JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) editor.commands.setContent(content, { emitUpdate: false });
        syncingRef.current = false;
    }, [content, editable, editor]);

    return (
        <div className={cx("tiptap-editor", editable && "min-h-32", !editable && "tiptap-editor-readonly", className)}>
            <EditorContent editor={editor} />
            {editable && editor && <RichTextToolbar editor={editor} />}
        </div>
    );
};

function RichTextToolbar({ editor }: { editor: NonNullable<ReturnType<typeof useEditor>> }) {
    const [isLinkEditorOpen, setIsLinkEditorOpen] = useState(false);
    const [url, setUrl] = useState("");

    const toggleLink = () => {
        setUrl(editor.getAttributes("link").href ?? "");
        setIsLinkEditorOpen(true);
    };

    const saveLink = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const href = url.trim();
        if (!href) {
            editor.chain().focus().unsetLink().run();
        } else {
            editor.chain().focus().setLink({ href }).run();
        }
        setIsLinkEditorOpen(false);
    };

    return (
        <div className="flex flex-wrap items-center gap-1 border-t border-secondary px-2 py-1">
            <ButtonUtility
                icon={Heading2}
                size="xs"
                color="tertiary"
                tooltip="Heading"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            />
            <ButtonUtility icon={Bold} size="xs" color="tertiary" tooltip="Bold" onClick={() => editor.chain().focus().toggleBold().run()} />
            <ButtonUtility icon={Italic} size="xs" color="tertiary" tooltip="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} />
            <ButtonUtility icon={List} size="xs" color="tertiary" tooltip="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} />
            <ButtonUtility icon={CheckSquare} size="xs" color="tertiary" tooltip="Task list" onClick={() => editor.chain().focus().toggleTaskList().run()} />
            <ButtonUtility icon={Quote} size="xs" color="tertiary" tooltip="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} />
            <ButtonUtility icon={Code2} size="xs" color="tertiary" tooltip="Code block" onClick={() => editor.chain().focus().toggleCodeBlock().run()} />
            <ButtonUtility icon={Link2} size="xs" color="tertiary" tooltip="Link" onClick={toggleLink} />
            {isLinkEditorOpen && (
                <form className="ml-1 flex items-center gap-2" onSubmit={saveLink}>
                    <input
                        autoFocus
                        type="url"
                        value={url}
                        onChange={(event) => setUrl(event.target.value)}
                        placeholder="https://example.com"
                        aria-label="Link URL"
                        className="h-7 w-52 rounded-md border border-secondary bg-primary px-2 text-xs text-primary outline-none focus:border-brand"
                    />
                    <ButtonUtility icon={Check} type="submit" size="xs" color="secondary" tooltip="Save link" />
                    <ButtonUtility icon={X} type="button" size="xs" color="tertiary" tooltip="Cancel" onClick={() => setIsLinkEditorOpen(false)} />
                </form>
            )}
        </div>
    );
}
