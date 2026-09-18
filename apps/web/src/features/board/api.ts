import type { CreateIssueInput, TiptapDocument, UpdateIssueInput } from "@gikan/shared";
import { apiClient } from "@/lib/api-client";

export interface BoardColumn {
    id: string;
    projectId: string;
    name: string;
    color: string | null;
    position: number;
    createdAt: string;
}

export interface CardPerson {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
}

export interface BoardCard {
    id: string;
    projectId: string;
    columnId: string;
    number: number;
    identifier: string;
    title: string;
    description: string | null;
    descriptionJson: TiptapDocument;
    assigneeId: string | null;
    categoryId: string | null;
    importance: "low" | "medium" | "high";
    priority: "low" | "medium" | "high";
    createdBy: string;
    position: number;
    parentIssueId: string | null;
    cycleId: string | null;
    estimate: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface CardDetail extends Omit<BoardCard, "createdBy"> {
    createdBy: CardPerson;
    assignee: CardPerson | null;
    category: { id: string; name: string; color: string | null } | null;
    column: { id: string; name: string };
}

function toPlainText(document: TiptapDocument): string {
    return (document.content ?? []).map((node) => (typeof node.text === "string" ? node.text : "")).join("\n");
}

function toDocument(value?: string | null): TiptapDocument | undefined {
    if (!value) return undefined;
    return { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: value }] }] };
}

function normalize(issue: any): BoardCard {
    return { ...issue, description: issue.descriptionJson ? toPlainText(issue.descriptionJson) : null, importance: issue.priority };
}

export function listColumns(projectId: string): Promise<BoardColumn[]> {
    return apiClient.get<{ columns: BoardColumn[] }>(`/projects/${projectId}/columns`).then((res) => res.columns);
}

export function createColumn(projectId: string, input: { name: string; color?: string | null }): Promise<BoardColumn> {
    return apiClient.post<{ column: BoardColumn }>(`/projects/${projectId}/columns`, input).then((res) => res.column);
}

export function updateColumn(projectId: string, columnId: string, input: { name?: string; color?: string | null; position?: number }): Promise<BoardColumn> {
    return apiClient.patch<{ column: BoardColumn }>(`/projects/${projectId}/columns/${columnId}`, input).then((res) => res.column);
}

export function deleteColumn(projectId: string, columnId: string): Promise<void> {
    return apiClient.delete<void>(`/projects/${projectId}/columns/${columnId}`);
}

export function listCards(projectId: string): Promise<BoardCard[]> {
    return apiClient.get<{ issues: any[] }>(`/projects/${projectId}/issues`).then((res) => res.issues.map(normalize));
}

export function createCard(
    projectId: string,
    input: {
        columnId: string;
        title: string;
        description?: string | null;
        categoryId?: string | null;
        assigneeId?: string | null;
        importance: BoardCard["importance"];
    },
): Promise<BoardCard> {
    const issueInput: CreateIssueInput = { ...input, priority: input.importance, descriptionJson: toDocument(input.description) };
    return apiClient.post<{ issue: any }>(`/projects/${projectId}/issues`, issueInput).then((res) => normalize(res.issue));
}

export function getCardDetail(identifier: string): Promise<CardDetail> {
    return apiClient.get<{ issue: any }>(`/issues/${encodeURIComponent(identifier)}`).then((res) => normalize(res.issue) as unknown as CardDetail);
}

export function updateCard(
    identifier: string,
    input: {
        title?: string;
        description?: string | null;
        columnId?: string;
        position?: number;
        categoryId?: string | null;
        assigneeId?: string | null;
        importance?: BoardCard["importance"];
    },
): Promise<BoardCard> {
    const { description, importance, ...rest } = input;
    const updateInput: UpdateIssueInput = { ...rest, priority: importance, descriptionJson: description === undefined ? undefined : toDocument(description) };
    return apiClient.patch<{ issue: any }>(`/issues/${encodeURIComponent(identifier)}`, updateInput).then((res) => normalize(res.issue));
}

export function deleteCard(identifier: string): Promise<void> {
    return apiClient.delete<void>(`/issues/${encodeURIComponent(identifier)}`);
}
