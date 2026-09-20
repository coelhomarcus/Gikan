import type { TiptapDocument } from "@gikan/shared";
import {
    getIssue,
    listIssueActivity,
    listIssueComments,
    listIssueRelations,
    type IssueActivity,
    type IssueComment,
    type IssueDetail,
    type IssueRelation,
} from "../api";

type IssueContentOverrides = {
    title?: string;
    description?: TiptapDocument;
};

const activityLabels: Record<string, string> = {
    created: "created this issue",
    status_changed: "changed the status",
    priority_changed: "changed the priority",
    assignee_changed: "changed the assignee",
    category_changed: "changed the category",
    cycle_changed: "changed the cycle",
    estimate_changed: "changed the estimate",
    parent_changed: "changed the parent issue",
    relation_added: "added a relation",
    relation_removed: "removed a relation",
};

/** Fetches the complete saved issue content before producing a clipboard-ready Markdown document. */
export async function fetchIssueClipboardContent(identifier: string, overrides?: IssueContentOverrides): Promise<string> {
    const [issue, comments, activity, relations] = await Promise.all([
        getIssue(identifier),
        listIssueComments(identifier),
        listIssueActivity(identifier),
        listIssueRelations(identifier),
    ]);

    return buildIssueClipboardContent({ issue, comments, activity, relations, overrides });
}

function buildIssueClipboardContent({
    issue,
    comments,
    activity,
    relations,
    overrides,
}: {
    issue: IssueDetail;
    comments: IssueComment[];
    activity: IssueActivity[];
    relations: IssueRelation[];
    overrides?: IssueContentOverrides;
}): string {
    const title = overrides?.title ?? issue.title;
    const description = overrides?.description ?? issue.descriptionJson;
    const lines = [
        `# ${issue.identifier}: ${title}`,
        "",
        `- **Project:** ${issue.project.name}`,
        `- **Status:** ${issue.column.name}`,
        `- **Priority:** ${capitalize(issue.priority)}`,
        `- **Assignee:** ${issue.assignee?.name ?? "Unassigned"}`,
        `- **Category:** ${issue.category?.name ?? "None"}`,
        `- **Cycle:** ${issue.cycle?.name ?? "None"}`,
        `- **Estimate:** ${issue.estimate ?? "None"}`,
        `- **Created by:** ${issue.createdBy.name}`,
        `- **Created:** ${formatDate(issue.createdAt)}`,
        `- **Updated:** ${formatDate(issue.updatedAt)}`,
        `- **Parent:** ${issue.parent ? `${issue.project.issueKey}-${issue.parent.number}: ${issue.parent.title}` : "None"}`,
        "",
        "## Description",
        "",
        tiptapDocumentToMarkdown(description) || "(No description)",
    ];

    if (issue.children.length > 0) {
        lines.push("", `## Sub-issues (${issue.children.length})`, "");
        issue.children.forEach((child) => {
            lines.push(`- [ ] ${issue.project.issueKey}-${child.number}: ${child.title} — ${child.priority} priority`);
        });
    }

    if (relations.length > 0) {
        lines.push("", "## Relations", "");
        relations.forEach((relation) => {
            lines.push(`- **${relation.type.replaceAll("_", " ")}:** ${relation.target.project.issueKey}-${relation.target.number}: ${relation.target.title}`);
        });
    }

    if (comments.length > 0) {
        lines.push("", `## Comments (${comments.length})`, "");
        comments.forEach((comment) => {
            lines.push(`### ${comment.author.name} — ${formatDate(comment.createdAt)}`, "", tiptapDocumentToMarkdown(comment.contentJson) || "(Empty comment)", "");
        });
    }

    if (activity.length > 0) {
        lines.push("## Activity", "");
        activity.forEach((entry) => {
            const payload = Object.keys(entry.payload).length > 0 ? ` — ${JSON.stringify(entry.payload)}` : "";
            lines.push(`- ${formatDate(entry.createdAt)} — ${entry.actor.name} ${activityLabels[entry.type] ?? entry.type}${payload}`);
        });
    }

    return lines.join("\n").trim();
}

function tiptapDocumentToMarkdown(document: TiptapDocument | null | undefined): string {
    if (!document || !Array.isArray(document.content)) return "";
    return document.content.map((node) => renderNode(asNode(node))).filter(Boolean).join("\n\n").trim();
}

type TiptapNode = Record<string, unknown>;

function asNode(value: unknown): TiptapNode {
    return value && typeof value === "object" ? value as TiptapNode : {};
}

function childrenOf(node: TiptapNode): TiptapNode[] {
    return Array.isArray(node.content) ? node.content.map(asNode) : [];
}

function renderNode(node: TiptapNode): string {
    const children = childrenOf(node);
    const renderedChildren = () => children.map(renderNode).filter(Boolean).join("");

    switch (node.type) {
        case "text":
            return applyMarks(String(node.text ?? ""), Array.isArray(node.marks) ? node.marks.map(asNode) : []);
        case "paragraph":
            return renderedChildren();
        case "heading": {
            const level = Math.max(1, Math.min(6, Number(asNode(node.attrs).level) || 1));
            return `${"#".repeat(level)} ${renderedChildren()}`;
        }
        case "bulletList":
            return children.map((item) => renderListItem(item, "- ")).join("\n");
        case "orderedList": {
            const start = Number(asNode(node.attrs).start) || 1;
            return children.map((item, index) => renderListItem(item, `${start + index}. `)).join("\n");
        }
        case "taskList":
            return children.map((item) => renderListItem(item, asNode(item.attrs).checked ? "- [x] " : "- [ ] ")).join("\n");
        case "listItem":
        case "taskItem":
            return renderedChildren();
        case "blockquote":
            return renderedChildren().split("\n").map((line) => `> ${line}`).join("\n");
        case "codeBlock": {
            const language = String(asNode(node.attrs).language ?? "");
            const code = children.map((child) => String(child.text ?? "")).join("");
            return `\`\`\`${language}\n${code}\n\`\`\``;
        }
        case "horizontalRule":
            return "---";
        case "hardBreak":
            return "\n";
        case "image": {
            const attrs = asNode(node.attrs);
            const alt = String(attrs.alt ?? "");
            const src = String(attrs.src ?? "");
            return src ? `![${alt}](${src})` : alt;
        }
        case "mention": {
            const attrs = asNode(node.attrs);
            return `@${String(attrs.label ?? attrs.username ?? attrs.id ?? "unknown")}`;
        }
        case "table":
            return renderTable(children);
        case "tableRow":
        case "tableHeader":
        case "tableCell":
            return renderedChildren();
        case "doc":
            return children.map(renderNode).filter(Boolean).join("\n\n");
        default:
            return renderedChildren();
    }
}

function renderListItem(item: TiptapNode, prefix: string): string {
    const content = childrenOf(item).map(renderNode).filter(Boolean).join(" ").replaceAll("\n", "\n  ");
    return `${prefix}${content}`;
}

function renderTable(rows: TiptapNode[]): string {
    const matrix = rows.map((row) => childrenOf(row).map((cell) =>
        childrenOf(cell).map(renderNode).filter(Boolean).join(" ").replaceAll("|", "\\|").replaceAll("\n", " "),
    ));
    if (matrix.length === 0) return "";
    const width = Math.max(...matrix.map((row) => row.length));
    const formatRow = (row: string[]) => `| ${Array.from({ length: width }, (_, index) => row[index] ?? "").join(" | ")} |`;
    return [formatRow(matrix[0]), formatRow(Array.from({ length: width }, () => "---")), ...matrix.slice(1).map(formatRow)].join("\n");
}

function applyMarks(text: string, marks: TiptapNode[]): string {
    return marks.reduce((value, mark) => {
        switch (mark.type) {
            case "bold":
                return `**${value}**`;
            case "italic":
                return `*${value}*`;
            case "strike":
                return `~~${value}~~`;
            case "code":
                return `\`${value}\``;
            case "underline":
                return `<u>${value}</u>`;
            case "link": {
                const href = String(asNode(mark.attrs).href ?? "");
                return href ? `[${value}](${href})` : value;
            }
            default:
                return value;
        }
    }, text);
}

function formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}
