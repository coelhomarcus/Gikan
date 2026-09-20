import type { TiptapDocument } from "@gikan/shared";
import i18n from "@/i18n/i18n";
import type { TranslationKey } from "@/i18n/resources";
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

const activityLabelKeys: Record<string, TranslationKey> = {
    created: "issue.createdThisIssue", status_changed: "issue.changedStatus", priority_changed: "issue.changedPriority",
    assignee_changed: "issue.changedAssignee", category_changed: "issue.changedCategory", cycle_changed: "issue.changedCycle",
    estimate_changed: "issue.changedEstimate", parent_changed: "issue.changedParent", relation_added: "issue.addedRelation", relation_removed: "issue.removedRelation",
};

/** Fetches the complete saved issue content before producing a clipboard-ready Markdown document. */
export async function fetchIssueClipboardContent(identifier: string, overrides?: IssueContentOverrides, locale = i18n.language): Promise<string> {
    const [issue, comments, activity, relations] = await Promise.all([
        getIssue(identifier),
        listIssueComments(identifier),
        listIssueActivity(identifier),
        listIssueRelations(identifier),
    ]);

    return buildIssueClipboardContent({ issue, comments, activity, relations, overrides, locale });
}

function buildIssueClipboardContent({
    issue,
    comments,
    activity,
    relations,
    overrides,
    locale,
}: {
    issue: IssueDetail;
    comments: IssueComment[];
    activity: IssueActivity[];
    relations: IssueRelation[];
    overrides?: IssueContentOverrides;
    locale: string;
}): string {
    const t = i18n.getFixedT(locale, "translation");
    const title = overrides?.title ?? issue.title;
    const description = overrides?.description ?? issue.descriptionJson;
    const lines = [
        `# ${issue.identifier}: ${title}`,
        "",
        `- **${t("issue.project")}:** ${issue.project.name}`,
        `- **${t("issue.status")}:** ${issue.column.name}`,
        `- **${t("issue.priority")}:** ${t(`issue.${issue.priority}`)}`,
        `- **${t("issue.assignee")}:** ${issue.assignee?.name ?? t("issue.unassigned")}`,
        `- **${t("issue.category")}:** ${issue.category?.name ?? t("issue.noneValue")}`,
        `- **${t("issue.cycle")}:** ${issue.cycle?.name ?? t("issue.noneValue")}`,
        `- **${t("issue.estimate")}:** ${issue.estimate ?? t("issue.noneValue")}`,
        `- **${t("issue.createdBy")}:** ${issue.createdBy.name}`,
        `- **${t("issue.created")}:** ${formatDate(issue.createdAt, locale)}`,
        `- **${t("issue.updated")}:** ${formatDate(issue.updatedAt, locale)}`,
        `- **${t("issue.parent")}:** ${issue.parent ? `${issue.project.issueKey}-${issue.parent.number}: ${issue.parent.title}` : t("issue.noneValue")}`,
        "",
        `## ${t("issue.description")}`,
        "",
        tiptapDocumentToMarkdown(description) || `(${t("issue.noDescription")})`,
    ];

    if (issue.children.length > 0) {
        lines.push("", `## ${t("issue.subIssues")} (${issue.children.length})`, "");
        issue.children.forEach((child) => {
            lines.push(`- [ ] ${issue.project.issueKey}-${child.number}: ${child.title} — ${t(`issue.${child.priority}`)}`);
        });
    }

    if (relations.length > 0) {
        lines.push("", `## ${t("issue.relations")}`, "");
        relations.forEach((relation) => {
            const relationTranslationKey: Record<IssueRelation["type"], TranslationKey> = {
                blocks: "issue.blocks",
                blocked_by: "issue.blockedBy",
                related: "issue.relatedTo",
                duplicate: "issue.duplicateOf",
            };
            lines.push(`- **${t(relationTranslationKey[relation.type])}:** ${relation.target.project.issueKey}-${relation.target.number}: ${relation.target.title}`);
        });
    }

    if (comments.length > 0) {
        lines.push("", `## ${t("issue.comments")} (${comments.length})`, "");
        comments.forEach((comment) => {
            lines.push(`### ${comment.author.name} — ${formatDate(comment.createdAt, locale)}`, "", tiptapDocumentToMarkdown(comment.contentJson) || `(${t("issue.emptyComment")})`, "");
        });
    }

    if (activity.length > 0) {
        lines.push(`## ${t("issue.activity")}`, "");
        activity.forEach((entry) => {
            const payload = Object.keys(entry.payload).length > 0 ? ` — ${JSON.stringify(entry.payload)}` : "";
            lines.push(`- ${formatDate(entry.createdAt, locale)} — ${entry.actor.name} ${activityLabelKeys[entry.type] ? t(activityLabelKeys[entry.type]) : entry.type}${payload}`);
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

function formatDate(value: string, locale: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
}
