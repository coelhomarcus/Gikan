import type { CreateDocumentInput } from "@gikan/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createDocument, getDocument, listDocuments } from "../api";

export const documentsKey = (projectId: string) => ["projects", projectId, "documents"] as const;
export const documentKey = (projectId: string, documentId: string) => [...documentsKey(projectId), documentId] as const;
export const useDocuments = (projectId: string) =>
    useQuery({ queryKey: documentsKey(projectId), queryFn: () => listDocuments(projectId), enabled: !!projectId });
export const useDocument = (projectId: string, documentId: string) =>
    useQuery({ queryKey: documentKey(projectId, documentId), queryFn: () => getDocument(projectId, documentId), enabled: !!projectId && !!documentId });
export function useCreateDocument(projectId: string) {
    const client = useQueryClient();
    return useMutation({
        mutationFn: (input: Partial<CreateDocumentInput> = {}) => createDocument(projectId, input),
        onSuccess: (page) => {
            client.setQueryData(documentKey(projectId, page.id), page);
            void client.invalidateQueries({ queryKey: documentsKey(projectId), exact: true });
        },
    });
}
