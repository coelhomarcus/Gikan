import { apiClient } from "@/lib/api-client";

export interface BoardColumn {
    id: string;
    projectId: string;
    name: string;
    color: string | null;
    position: number;
    createdAt: string;
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
