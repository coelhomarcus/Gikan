import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { TiptapDocument } from "@gikan/shared";
import { Bold, Check, CheckSquare, Code2, Heading2, Italic, Link2, List, ListOrdered, Minus, MoreHorizontal, Quote, Strikethrough } from "lucide-react";
import Link from "@tiptap/extension-link";
import Mention from "@tiptap/extension-mention";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { Placeholder } from "@tiptap/extensions";
import { PluginKey } from "@tiptap/pm/state";
import { BubbleMenu } from "@tiptap/react/menus";
import { EditorContent, Extension, useEditor, type Editor } from "@tiptap/react";
import Suggestion, { type SuggestionProps } from "@tiptap/suggestion";
import StarterKit from "@tiptap/starter-kit";
import { Popover as BasePopover } from "@base-ui/react/popover";
import { Button, type Props as ButtonProps } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { Input } from "@/components/base/input/input";
import { ToggleGroupItem, ToggleGroupRoot } from "@/components/base/toggle-group/toggle-group";
import { cx } from "@/utils/cx";

export const EMPTY_TIPTAP_DOCUMENT: TiptapDocument = { type: "doc", content: [] };

interface MentionItem {
    id: string;
    label: string;
    description?: string;
}

interface SlashItem {
    id: string;
    label: string;
    description: string;
    icon: typeof Heading2;
    run: (editor: Editor) => void;
}

function SuggestionMenu<T extends { id: string; label: string; description?: string; icon?: typeof Heading2 }>({ items, selectedIndex, onSelect }: { items: T[]; selectedIndex: number; onSelect: (item: T) => void }) {
    return (
        <div role="listbox" aria-label="Editor suggestions" className="min-w-60 overflow-hidden rounded-lg border border-subtle bg-surface-1 p-1 shadow-2xl">
            {items.length === 0 ? <p className="px-3 py-2 text-xs text-tertiary">No matching commands</p> : items.map((item, index) => {
                const Icon = item.icon;
                return (
                    <button key={item.id} type="button" role="option" aria-selected={index === selectedIndex} className={cx("flex min-h-9 w-full items-center gap-2 rounded-md px-2.5 py-2 text-left", index === selectedIndex && "bg-surface-2")} onMouseDown={(event) => { event.preventDefault(); onSelect(item); }}>
                        {Icon && <Icon className="size-4 shrink-0 text-tertiary" />}
                        <span className="min-w-0"><span className="block text-sm font-medium text-primary">{item.label}</span>{item.description && <span className="block truncate text-xs text-tertiary">{item.description}</span>}</span>
                    </button>
                );
            })}
        </div>
    );
}

function createSuggestionRenderer<T extends { id: string; label: string; description?: string; icon?: typeof Heading2 }>() {
    let popup: HTMLDivElement | null = null;
    let root: Root | null = null;
    let selectedIndex = 0;
    let currentItems: T[] = [];
    let selectItem: ((item: T) => void) | null = null;

    const render = (props: SuggestionProps<T, T>) => {
        currentItems = props.items;
        selectedIndex = Math.min(selectedIndex, Math.max(0, currentItems.length - 1));
        selectItem = props.command;
        if (!popup) {
            popup = document.createElement("div");
            popup.className = "fixed z-[100]";
            document.body.appendChild(popup);
            root = createRoot(popup);
        }
        root?.render(<SuggestionMenu items={currentItems} selectedIndex={selectedIndex} onSelect={(item) => selectItem?.(item)} />);
        const rect = props.clientRect?.();
        if (rect && popup) {
            popup.style.left = `${rect.left}px`;
            popup.style.top = `${rect.bottom + 6}px`;
        }
    };

    return {
        onStart: render,
        onUpdate: render,
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (!popup) return false;
            if (event.key === "ArrowDown" && currentItems.length > 0) {
                selectedIndex = (selectedIndex + 1) % currentItems.length;
                root?.render(<SuggestionMenu items={currentItems} selectedIndex={selectedIndex} onSelect={(item) => selectItem?.(item)} />);
                return true;
            }
            if (event.key === "ArrowUp" && currentItems.length > 0) {
                selectedIndex = (selectedIndex + currentItems.length - 1) % currentItems.length;
                root?.render(<SuggestionMenu items={currentItems} selectedIndex={selectedIndex} onSelect={(item) => selectItem?.(item)} />);
                return true;
            }
            if (event.key === "Enter" && currentItems[selectedIndex]) {
                selectItem?.(currentItems[selectedIndex]);
                return true;
            }
            return event.key === "Escape";
        },
        onExit: () => {
            root?.unmount();
            popup?.remove();
            root = null;
            popup = null;
            currentItems = [];
            selectItem = null;
            selectedIndex = 0;
        },
    };
}

function createMentionSuggestion(items: MentionItem[]) {
    return {
        items: ({ query }: { query: string }) => items.filter((item) => `${item.label} ${item.description ?? ""}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8),
        render: () => createSuggestionRenderer<MentionItem>(),
    };
}

const SLASH_PLUGIN_KEY = new PluginKey("gikan-slash-commands");

function createSlashSuggestion() {
    const commands: SlashItem[] = [
        { id: "paragraph", label: "Text", description: "Start with a plain paragraph", icon: Heading2, run: (editor) => editor.chain().setParagraph().run() },
        { id: "heading", label: "Heading", description: "Add a section heading", icon: Heading2, run: (editor) => editor.chain().toggleHeading({ level: 2 }).run() },
        { id: "bullet-list", label: "Bullet list", description: "Create a simple list", icon: List, run: (editor) => editor.chain().toggleBulletList().run() },
        { id: "ordered-list", label: "Numbered list", description: "Create a numbered list", icon: ListOrdered, run: (editor) => editor.chain().toggleOrderedList().run() },
        { id: "task-list", label: "Task list", description: "Track a checklist", icon: CheckSquare, run: (editor) => editor.chain().toggleTaskList().run() },
        { id: "quote", label: "Quote", description: "Highlight a quotation", icon: Quote, run: (editor) => editor.chain().toggleBlockquote().run() },
        { id: "code", label: "Code block", description: "Add formatted code", icon: Code2, run: (editor) => editor.chain().toggleCodeBlock().run() },
        { id: "divider", label: "Divider", description: "Separate sections", icon: Minus, run: (editor) => editor.chain().setHorizontalRule().run() },
    ];
    return Extension.create({
        name: "slashCommands",
        addProseMirrorPlugins() {
            return [Suggestion<SlashItem>({
                editor: this.editor,
                pluginKey: SLASH_PLUGIN_KEY,
                char: "/",
                items: ({ query }) => commands.filter((command) => `${command.label} ${command.description}`.toLowerCase().includes(query.toLowerCase())),
                command: ({ editor, range, props }) => { editor.chain().focus().deleteRange(range).run(); props.run(editor); },
                render: () => createSuggestionRenderer<SlashItem>(),
            })];
        },
    });
}

interface RichTextEditorProps {
    content: TiptapDocument;
    editable?: boolean;
    onChange?: (content: TiptapDocument) => void;
    placeholder?: string;
    mentionItems?: MentionItem[];
    className?: string;
    onSubmitShortcut?: () => void;
    toolbar?: boolean;
    variant?: "document" | "description" | "comment";
}

export const RichTextEditor = ({ content, editable = true, onChange, placeholder = "Write something...", mentionItems = [], className, onSubmitShortcut, variant = "document", toolbar = true }: RichTextEditorProps) => {
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
            ...(editable ? [createSlashSuggestion()] : []),
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

    return <div className={cx("tiptap-editor", editable && "min-h-32", !editable && "tiptap-editor-readonly", `tiptap-editor-${variant}`, className)}>
        {editable && toolbar && editor && <RichTextToolbar editor={editor} />}
        {editable && editor && <RichTextBubbleMenu editor={editor} />}
        <EditorContent editor={editor} />
    </div>;
};

function FormatButton({ icon: Icon, label, active, onClick }: { icon: ButtonProps["iconLeading"]; label: string; active?: boolean; onClick: () => void }) {
    return <ButtonUtility icon={Icon} size="xs" color={active ? "secondary" : "tertiary"} tooltip={label} aria-label={label} aria-pressed={active} onClick={onClick} />;
}

function RichTextToolbar({ editor }: { editor: NonNullable<ReturnType<typeof useEditor>> }) {
    const [isLinkEditorOpen, setIsLinkEditorOpen] = useState(false);
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const [url, setUrl] = useState("");
    const toggleLink = () => { setUrl(editor.getAttributes("link").href ?? ""); setIsLinkEditorOpen(true); setIsMoreOpen(false); };
    const saveLink = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const href = url.trim();
        if (!href) editor.chain().focus().unsetLink().run();
        else editor.chain().focus().setLink({ href }).run();
        setIsLinkEditorOpen(false);
    };
    return <div className="tiptap-toolbar sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-subtle bg-surface-1/95 px-2 py-1.5 backdrop-blur">
        <ToggleGroupRoot aria-label="Text formatting">
            <ToggleGroupItem value="bold" aria-label="Bold" pressed={editor.isActive("bold")} onPressedChange={() => editor.chain().focus().toggleBold().run()}><Bold className="size-4" /></ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Italic" pressed={editor.isActive("italic")} onPressedChange={() => editor.chain().focus().toggleItalic().run()}><Italic className="size-4" /></ToggleGroupItem>
            <ToggleGroupItem value="strike" aria-label="Strikethrough" pressed={editor.isActive("strike")} onPressedChange={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="size-4" /></ToggleGroupItem>
        </ToggleGroupRoot>
        <span className="mx-1 h-5 w-px bg-border-secondary" aria-hidden="true" />
        <FormatButton icon={Heading2} label="Heading" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
        <BasePopover.Root open={isLinkEditorOpen} onOpenChange={setIsLinkEditorOpen}>
            <BasePopover.Trigger
                render={<button type="button" aria-label="Link" aria-pressed={editor.isActive("link")} className={cx("inline-flex size-7 items-center justify-center rounded-md text-tertiary outline-accent-strong transition-colors hover:bg-layer-1-hover hover:text-primary", editor.isActive("link") && "bg-surface-2 text-primary")} onClick={toggleLink} />}
            >
                <Link2 className="size-4" />
            </BasePopover.Trigger>
            <BasePopover.Portal>
                <BasePopover.Positioner side="bottom" align="start" sideOffset={6} className="z-50">
                    <BasePopover.Popup className="w-72 rounded-lg border border-subtle bg-surface-1 p-3 shadow-2xl outline-none">
                        <form className="flex flex-col gap-2" onSubmit={saveLink}>
                            <label className="text-xs font-medium text-secondary" htmlFor="tiptap-link-url">Link URL</label>
                            <Input autoFocus id="tiptap-link-url" size="sm" type="url" value={url} onChange={setUrl} placeholder="https://example.com" />
                            <div className="flex justify-end gap-2 pt-1">
                                <Button type="button" size="xs" color="tertiary" onClick={() => { editor.chain().focus().unsetLink().run(); setIsLinkEditorOpen(false); }}>Remove</Button>
                                <Button type="submit" size="xs" iconLeading={Check}>Save link</Button>
                            </div>
                        </form>
                    </BasePopover.Popup>
                </BasePopover.Positioner>
            </BasePopover.Portal>
        </BasePopover.Root>
        <div className="relative">
            <FormatButton icon={MoreHorizontal} label="More formatting" active={isMoreOpen} onClick={() => setIsMoreOpen((open) => !open)} />
            {isMoreOpen && <div className="absolute top-9 left-0 z-20 flex min-w-44 flex-col gap-1 rounded-lg border border-subtle bg-surface-1 p-1 shadow-xl">
                <Button size="xs" color="tertiary" className="justify-start" iconLeading={List} onClick={() => editor.chain().focus().toggleBulletList().run()}>Bullet list</Button>
                <Button size="xs" color="tertiary" className="justify-start" iconLeading={ListOrdered} onClick={() => editor.chain().focus().toggleOrderedList().run()}>Numbered list</Button>
                <Button size="xs" color="tertiary" className="justify-start" iconLeading={CheckSquare} onClick={() => editor.chain().focus().toggleTaskList().run()}>Task list</Button>
                <Button size="xs" color="tertiary" className="justify-start" iconLeading={Quote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>Quote</Button>
                <Button size="xs" color="tertiary" className="justify-start" iconLeading={Code2} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>Code block</Button>
                <Button size="xs" color="tertiary" className="justify-start" iconLeading={Minus} onClick={() => editor.chain().focus().setHorizontalRule().run()}>Divider</Button>
            </div>}
        </div>
    </div>;
}

function RichTextBubbleMenu({ editor }: { editor: NonNullable<ReturnType<typeof useEditor>> }) {
    return <BubbleMenu editor={editor} options={{ placement: "top" }} className="flex items-center gap-1 rounded-lg border border-subtle bg-surface-1 p-1 shadow-2xl">
        <FormatButton icon={Bold} label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} />
        <FormatButton icon={Italic} label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} />
        <FormatButton icon={Strikethrough} label="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} />
        <LinkPopover editor={editor} />
    </BubbleMenu>;
}

function LinkPopover({ editor }: { editor: NonNullable<ReturnType<typeof useEditor>> }) {
    const [open, setOpen] = useState(false);
    const [url, setUrl] = useState("");

    function openEditor() {
        setUrl(editor.getAttributes("link").href ?? "");
        setOpen(true);
    }

    function save(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const href = url.trim();
        if (!href) editor.chain().focus().unsetLink().run();
        else editor.chain().focus().setLink({ href }).run();
        setOpen(false);
    }

    return <BasePopover.Root open={open} onOpenChange={setOpen}>
        <BasePopover.Trigger
            render={<button type="button" aria-label="Link" aria-pressed={editor.isActive("link")} className={cx("inline-flex size-7 items-center justify-center rounded-md text-tertiary outline-accent-strong transition-colors hover:bg-layer-1-hover hover:text-primary", editor.isActive("link") && "bg-surface-2 text-primary")} onClick={openEditor} />}
        >
            <Link2 className="size-4" />
        </BasePopover.Trigger>
        <BasePopover.Portal>
            <BasePopover.Positioner side="bottom" align="start" sideOffset={6} className="z-[110]">
                <BasePopover.Popup className="w-72 rounded-lg border border-subtle bg-surface-1 p-3 shadow-2xl outline-none">
                    <form className="flex flex-col gap-2" onSubmit={save}>
                        <label className="text-xs font-medium text-secondary" htmlFor="tiptap-bubble-link-url">Link URL</label>
                        <Input autoFocus id="tiptap-bubble-link-url" size="sm" type="url" value={url} onChange={setUrl} placeholder="https://example.com" />
                        <div className="flex justify-end gap-2 pt-1">
                            <Button type="button" size="xs" color="tertiary" onClick={() => { editor.chain().focus().unsetLink().run(); setOpen(false); }}>Remove</Button>
                            <Button type="submit" size="xs" iconLeading={Check}>Save link</Button>
                        </div>
                    </form>
                </BasePopover.Popup>
            </BasePopover.Positioner>
        </BasePopover.Portal>
    </BasePopover.Root>;
}
