import type { CreateDocumentInput, TiptapDocument, UpdateDocumentInput } from "@gikan/shared";
import { ApiError, apiClient } from "@/lib/api-client";

export interface DocumentPage {
    id: string;
    projectId: string;
    title: string;
    contentJson: TiptapDocument;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    revision: number;
}
export type DocumentSummary = Omit<DocumentPage, "contentJson">;
const base = (projectId: string) => `/projects/${projectId}/documents`;
export const listDocuments = (projectId: string) => apiClient.get<{ documents: DocumentSummary[] }>(base(projectId)).then((r) => r.documents);
export const getDocument = (projectId: string, id: string) => apiClient.get<{ document: DocumentPage }>(`${base(projectId)}/${id}`).then((r) => r.document);
export const createDocument = (projectId: string, input: Partial<CreateDocumentInput> = {}) =>
    apiClient.post<{ document: DocumentPage }>(base(projectId), input).then((r) => r.document);
export const deleteDocument = (projectId: string, id: string) => apiClient.delete<void>(`${base(projectId)}/${id}`);
export async function saveDocument(projectId: string, id: string, input: UpdateDocumentInput, signal?: AbortSignal): Promise<DocumentPage> {
    const response = await fetch(`/api${base(projectId)}/${id}`, {
        method: "PATCH",
        credentials: "include",
        signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new ApiError(response.status, body.error ?? "Could not save the page.");
    return body.document;
}
