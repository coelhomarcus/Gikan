import { useEffect, useMemo } from "react";
import type { TiptapDocument } from "@gikan/shared";
import Link from "@tiptap/extension-link";
import Mention from "@tiptap/extension-mention";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold01, CheckSquare, Code02, Italic01, Link01, List, Type01 } from "@untitledui/icons";
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
                        button.innerHTML = `<span class="text-sm font-medium text-primary">@${item.label}</span>${item.description ? `<span class="text-xs text-tertiary">${item.description}</span>` : ""}`;
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
}

export const RichTextEditor = ({
    content,
    editable = true,
    onChange,
    placeholder = "Write something...",
    mentionItems = [],
    className,
}: RichTextEditorProps) => {
    const mentionSuggestion = useMemo(() => createMentionSuggestion(mentionItems), [mentionItems]);
    const editor = useEditor({
        immediatelyRender: false,
        editable,
        content,
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
            Link.configure({ openOnClick: !editable, autolink: true }),
            TaskList,
            TaskItem.configure({ nested: true }),
            Placeholder.configure({ placeholder }),
            Mention.configure({ HTMLAttributes: { class: "mention" }, suggestion: mentionSuggestion }),
        ],
        onUpdate: ({ editor: currentEditor }) => onChange?.(currentEditor.getJSON() as TiptapDocument),
    });

    useEffect(() => {
        if (!editor) return;
        editor.setEditable(editable);
        if (JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) editor.commands.setContent(content, { emitUpdate: false });
    }, [content, editable, editor]);

    return (
        <div className={cx("tiptap-editor min-h-32", !editable && "tiptap-editor-readonly", className)}>
            <EditorContent editor={editor} />
            {editable && editor && <RichTextToolbar editor={editor} />}
        </div>
    );
};

function RichTextToolbar({ editor }: { editor: NonNullable<ReturnType<typeof useEditor>> }) {
    const toggleLink = () => {
        if (editor.isActive("link")) {
            editor.chain().focus().unsetLink().run();
            return;
        }
        const href = window.prompt("Link URL");
        if (href) editor.chain().focus().setLink({ href }).run();
    };

    return (
        <div className="flex flex-wrap items-center gap-1 border-t border-secondary px-2 py-1">
            <ButtonUtility
                icon={Type01}
                size="xs"
                color="tertiary"
                tooltip="Heading"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            />
            <ButtonUtility icon={Bold01} size="xs" color="tertiary" tooltip="Bold" onClick={() => editor.chain().focus().toggleBold().run()} />
            <ButtonUtility icon={Italic01} size="xs" color="tertiary" tooltip="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} />
            <ButtonUtility icon={List} size="xs" color="tertiary" tooltip="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} />
            <ButtonUtility icon={CheckSquare} size="xs" color="tertiary" tooltip="Task list" onClick={() => editor.chain().focus().toggleTaskList().run()} />
            <ButtonUtility icon={List} size="xs" color="tertiary" tooltip="Quote" onClick={() => editor.chain().focus().toggleBlockquote().run()} />
            <ButtonUtility icon={Code02} size="xs" color="tertiary" tooltip="Code block" onClick={() => editor.chain().focus().toggleCodeBlock().run()} />
            <ButtonUtility icon={Link01} size="xs" color="tertiary" tooltip="Link" onClick={toggleLink} />
        </div>
    );
}
