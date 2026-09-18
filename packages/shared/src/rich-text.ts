import type { TiptapDocument } from "./schemas/issues";

type TiptapNode = Record<string, unknown>;

function textNode(text: string, marks?: TiptapNode[]): TiptapNode {
    return marks?.length ? { type: "text", text, marks } : { type: "text", text };
}

function inlineContent(value: string): TiptapNode[] {
    const nodes: TiptapNode[] = [];
    const pattern = /\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|__([^_]+)__|(?<!\*)\*([^*]+)\*(?!\*)|(?<!_)_([^_]+)_(?!_)/g;
    let cursor = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(value))) {
        if (match.index > cursor) nodes.push(textNode(value.slice(cursor, match.index)));
        if (match[1] && match[2]) nodes.push({ type: "text", text: match[1], marks: [{ type: "link", attrs: { href: match[2], target: "_blank", class: null } }] });
        else if (match[3]) nodes.push(textNode(match[3], [{ type: "code" }]));
        else if (match[4] || match[5]) nodes.push(textNode(match[4] ?? match[5], [{ type: "bold" }]));
        else nodes.push(textNode(match[6] ?? match[7] ?? "", [{ type: "italic" }]));
        cursor = match.index + match[0].length;
    }
    if (cursor < value.length) nodes.push(textNode(value.slice(cursor)));
    return nodes;
}

function paragraph(value: string): TiptapNode {
    const content = inlineContent(value);
    return content.length ? { type: "paragraph", content } : { type: "paragraph" };
}

function listItem(value: string): TiptapNode {
    return { type: "listItem", content: [paragraph(value)] };
}

export function markdownToTiptap(markdown: string | null | undefined): TiptapDocument {
    const lines = (markdown ?? "").replace(/\r\n?/g, "\n").split("\n");
    const content: TiptapNode[] = [];
    let index = 0;

    while (index < lines.length) {
        const line = lines[index];
        if (!line.trim()) {
            index += 1;
            continue;
        }
        const fence = /^\s*```(\w*)\s*$/.exec(line);
        if (fence) {
            const codeLines: string[] = [];
            index += 1;
            while (index < lines.length && !/^\s*```\s*$/.test(lines[index])) codeLines.push(lines[index++]);
            if (index < lines.length) index += 1;
            content.push({ type: "codeBlock", attrs: { language: fence[1] || null }, ...(codeLines.length ? { content: [textNode(codeLines.join("\n"))] } : {}) });
            continue;
        }
        const heading = /^(#{1,6})\s+(.+)$/.exec(line);
        if (heading) {
            content.push({ type: "heading", attrs: { level: Math.min(3, heading[1].length) }, content: inlineContent(heading[2]) });
            index += 1;
            continue;
        }
        if (/^\s*(---+|\*\*\*)\s*$/.test(line)) {
            content.push({ type: "horizontalRule" });
            index += 1;
            continue;
        }
        if (/^\s*>/.test(line)) {
            const quoteLines: string[] = [];
            while (index < lines.length && /^\s*>/.test(lines[index])) quoteLines.push(lines[index++].replace(/^\s*>\s?/, ""));
            content.push({ type: "blockquote", content: [paragraph(quoteLines.join(" "))] });
            continue;
        }
        const task = /^\s*[-*]\s+\[([ xX])\]\s+(.+)$/.exec(line);
        if (task) {
            const items: TiptapNode[] = [];
            while (index < lines.length) {
                const item = /^\s*[-*]\s+\[([ xX])\]\s+(.+)$/.exec(lines[index]);
                if (!item) break;
                items.push({ type: "taskItem", attrs: { checked: item[1].toLowerCase() === "x" }, content: [paragraph(item[2])] });
                index += 1;
            }
            content.push({ type: "taskList", content: items });
            continue;
        }
        const bullet = /^\s*[-*+]\s+(.+)$/.exec(line);
        if (bullet) {
            const items: TiptapNode[] = [];
            while (index < lines.length) {
                const item = /^\s*[-*+]\s+(.+)$/.exec(lines[index]);
                if (!item) break;
                items.push(listItem(item[1]));
                index += 1;
            }
            content.push({ type: "bulletList", content: items });
            continue;
        }
        const ordered = /^\s*\d+[.)]\s+(.+)$/.exec(line);
        if (ordered) {
            const items: TiptapNode[] = [];
            while (index < lines.length) {
                const item = /^\s*\d+[.)]\s+(.+)$/.exec(lines[index]);
                if (!item) break;
                items.push(listItem(item[1]));
                index += 1;
            }
            content.push({ type: "orderedList", attrs: { start: 1 }, content: items });
            continue;
        }
        const paragraphLines = [line];
        index += 1;
        while (index < lines.length && lines[index].trim() && !/^(#{1,6})\s+|^\s*```|^\s*>|^\s*[-*+]\s+|^\s*\d+[.)]\s+/.test(lines[index])) paragraphLines.push(lines[index++]);
        content.push(paragraph(paragraphLines.join("\n")));
    }
    return { type: "doc", content };
}
