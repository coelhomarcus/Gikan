import type { Issue } from "../api";

export function filterIssues(issues: Issue[], query: URLSearchParams) {
    const search = (query.get("q") ?? "").toLowerCase();
    return issues.filter(
        (issue) =>
            (!search || `${issue.identifier} ${issue.title}`.toLowerCase().includes(search)) &&
            (!query.get("priority") || issue.priority === query.get("priority")) &&
            (!query.get("status") || issue.columnId === query.get("status")) &&
            (!query.get("assignee") || issue.assigneeId === query.get("assignee")) &&
            (!query.get("label") || issue.categoryId === query.get("label")) &&
            (!query.get("cycle") || issue.cycleId === query.get("cycle")),
    );
}
export function readIssueOrder(value: string | null): "position" | "priority" | "updated" | "number" {
    return value === "priority" || value === "updated" || value === "number" ? value : "position";
}
