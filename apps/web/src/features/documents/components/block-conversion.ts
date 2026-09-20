import type { Node } from "@tiptap/pm/model";
import type { Editor, JSONContent } from "@tiptap/react";

/** Convert a whole block without dropping the inline content of its list items. */
export function convertDocumentBlock(editor: Editor, position: number, type: string) {
    let block: Node | null = null;
    let blockPosition = 0;
    for (let index = 0; index < editor.state.doc.childCount; index++) {
        const candidate = editor.state.doc.child(index);
        if (blockPosition === position) {
            block = candidate;
            break;
        }
        blockPosition += candidate.nodeSize;
    }
    if (!block || ["image", "table", "horizontalRule"].includes(block.type.name)) return;
    if (block.isTextblock && (type === "text" || type.startsWith("heading-"))) {
        const replacement =
            type === "text"
                ? editor.schema.nodes.paragraph.create(null, block.content)
                : editor.schema.nodes.heading.create({ level: Number(type.at(-1)) }, block.content);
        editor.view.dispatch(editor.state.tr.replaceWith(position, position + block.nodeSize, replacement).scrollIntoView());
        editor.view.focus();
        return;
    }
    const paragraphs: JSONContent[] = [];
    const collect = (node: Node) => {
        if (node.isTextblock) {
            paragraphs.push({ type: "paragraph", content: node.content.toJSON() ?? [] });
            return;
        }
        node.forEach(collect);
    };
    collect(block);
    if (!paragraphs.length) paragraphs.push({ type: "paragraph" });
    let content: JSONContent[];
    if (type.startsWith("heading-")) {
        content = paragraphs.map((paragraph) => ({ ...paragraph, type: "heading", attrs: { level: Number(type.at(-1)) } }));
    } else if (["bullet", "numbered", "task"].includes(type)) {
        content = [
            {
                type: type === "bullet" ? "bulletList" : type === "numbered" ? "orderedList" : "taskList",
                content: paragraphs.map((paragraph) => ({
                    type: type === "task" ? "taskItem" : "listItem",
                    ...(type === "task" ? { attrs: { checked: false } } : {}),
                    content: [paragraph],
                })),
            },
        ];
    } else if (type === "quote") {
        content = [{ type: "blockquote", content: paragraphs }];
    } else if (type === "code") {
        const text = block.textBetween(0, block.content.size, "\n", "\n");
        content = [{ type: "codeBlock", content: text ? [{ type: "text", text }] : [] }];
    } else {
        content = paragraphs;
    }
    editor
        .chain()
        .focus()
        .insertContentAt({ from: position, to: position + block.nodeSize }, content)
        .run();
}
