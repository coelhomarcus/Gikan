import { useEffect, useRef } from "react";
import type { TiptapDocument } from "@gikan/shared";
import Link from "@tiptap/extension-link";
import Mention from "@tiptap/extension-mention";
import { TableKit } from "@tiptap/extension-table";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, Extension, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Suggestion from "@tiptap/suggestion";
import { DocumentBlockControls } from "./document-block-controls";
import "./document-editor.css";
import { DocumentFormatMenu } from "./document-format-menu";
import { DocumentImage } from "./document-image";
import { type EditorCommand, documentMentionKey, documentSlashKey, documentSuggestions, executeBlockCommand, filterBlockCommands } from "./editor-suggestions";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/i18n";

const SlashCommands = Extension.create({
    name: "documentSlashCommands",
    addProseMirrorPlugins() {
        return [
            Suggestion<EditorCommand>({
                editor: this.editor,
                pluginKey: documentSlashKey,
                char: "/",
                items: ({ query }) => filterBlockCommands(query),
                allow: ({ state }) => {
                    const allowed = state.selection.empty && !state.selection.$from.parent.type.spec.code;
                    return allowed;
                },
                command: ({ editor, range, props }) => {
                    executeBlockCommand(editor, props, range);
                },
                render: () => documentSuggestions(documentSlashKey),
            }),
        ];
    },
});

const HeadingEnter = Extension.create({
    name: "documentHeadingEnter",
    addKeyboardShortcuts() {
        return {
            Enter: () => {
                const { editor } = this;
                const { selection } = editor.state;
                const { $from, $to } = selection;

                if (
                    editor.view.composing ||
                    documentSlashKey.getState(editor.state)?.active ||
                    documentMentionKey.getState(editor.state)?.active ||
                    !$from.sameParent($to) ||
                    $from.parent.type.name !== "heading"
                ) {
                    return false;
                }

                if ($from.parent.content.size === 0) return editor.commands.setParagraph();

                if (selection.empty && $from.parentOffset === 0) {
                    if ($from.depth !== 1) return false;
                    const position = $from.before();
                    editor
                        .chain()
                        .insertContentAt(position, { type: "paragraph" })
                        .setTextSelection(position + 1)
                        .run();
                    return true;
                }

                editor.chain().splitBlock().setParagraph().run();
                return true;
            },
        };
    },
});

export function DocumentEditor({
    content,
    contentVersion,
    onChange,
    members,
    disabled = false,
}: {
    content: TiptapDocument;
    /** Changes only when an authoritative external version replaces the local editor state. */
    contentVersion: number;
    onChange: (content: TiptapDocument) => void;
    members: { id: string; name: string }[];
    disabled?: boolean;
}) {
    const { t } = useTranslation();
    const onChangeRef = useRef(onChange),
        membersRef = useRef(members),
        appliedContentVersion = useRef(contentVersion);
    onChangeRef.current = onChange;
    membersRef.current = members;
    const editor = useEditor({
        immediatelyRender: false,
        content,
        editorProps: { attributes: { "aria-label": t("editor.documentContent"), role: "textbox", "aria-multiline": "true", spellcheck: "true" } },
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: false, dropcursor: { color: "var(--bg-accent-primary)", width: 2 } }),
            Link.configure({ openOnClick: false, autolink: true, defaultProtocol: "https" }),
            TaskList,
            TaskItem.configure({ nested: true }),
            DocumentImage,
            TableKit.configure({ table: { resizable: true, allowTableNodeSelection: true } }),
            Placeholder.configure({ placeholder: () => i18n.t("editor.writeOrSlash") }),
            Mention.configure({
                HTMLAttributes: { class: "mention" },
                suggestion: {
                    pluginKey: documentMentionKey,
                    items: ({ query }) =>
                        membersRef.current
                            .filter((member) => member.name.toLowerCase().includes(query.toLowerCase()))
                            .slice(0, 8)
                            .map((member) => ({ id: member.id, label: member.name })),
                    render: () => documentSuggestions(documentMentionKey),
                },
            }),
            SlashCommands,
            HeadingEnter,
        ],
        onUpdate: ({ editor: current }) => onChangeRef.current(current.getJSON() as TiptapDocument),
    });
    useEffect(() => {
        editor?.setEditable(!disabled, false);
    }, [editor, disabled]);
    useEffect(() => {
        if (!editor) return;
        editor.view.dom.setAttribute("aria-label", t("editor.documentContent"));
        editor.view.dispatch(editor.state.tr.setMeta("document-language-changed", true));
    }, [editor, t]);
    useEffect(() => {
        if (!editor || appliedContentVersion.current === contentVersion) return;
        appliedContentVersion.current = contentVersion;
        if (JSON.stringify(content) !== JSON.stringify(editor.getJSON())) editor.commands.setContent(content, { emitUpdate: false });
    }, [content, contentVersion, editor]);
    // Native ProseMirror dragging supplies the drop cursor; keep long pages scrolling near the edges.
    useEffect(() => {
        if (!editor) return;
        const scroller = editor.view.dom.closest<HTMLElement>("[data-document-scroll]");
        if (!scroller) return;
        let frame = 0,
            velocity = 0;
        const tick = () => {
            scroller.scrollTop += velocity;
            frame = requestAnimationFrame(tick);
        };
        const drag = (event: DragEvent) => {
            const rect = scroller.getBoundingClientRect();
            velocity = event.clientY < rect.top + 64 ? -12 : event.clientY > rect.bottom - 64 ? 12 : 0;
            if (!frame) frame = requestAnimationFrame(tick);
        };
        const stop = () => {
            cancelAnimationFrame(frame);
            frame = 0;
            velocity = 0;
        };
        scroller.addEventListener("dragover", drag);
        scroller.addEventListener("dragleave", stop);
        window.addEventListener("drop", stop);
        window.addEventListener("dragend", stop);
        return () => {
            stop();
            scroller.removeEventListener("dragover", drag);
            scroller.removeEventListener("dragleave", stop);
            window.removeEventListener("drop", stop);
            window.removeEventListener("dragend", stop);
        };
    }, [editor]);
    return (
        <div
            className="document-editor"
            onClick={(event) => {
                if (event.target === event.currentTarget) editor?.commands.focus("end");
            }}
        >
            {editor && !disabled && (
                <>
                    <DocumentBlockControls key={`blocks:${contentVersion}`} editor={editor} />
                    <DocumentFormatMenu key={`format:${contentVersion}`} editor={editor} />
                </>
            )}
            <EditorContent editor={editor} className="document-editor-content" />
        </div>
    );
}
