import type { QueryClient } from "@tanstack/react-query";
import { type DocumentPage, type DocumentSummary, saveDocument } from "./api";
import { DocumentSession } from "./document-session";
import { draftStore } from "./draft-store";
import { documentKey, documentsKey } from "./hooks/use-documents";

const sessions = new Map<string, DocumentSession>();
const keyOf = (userId: string, projectId: string, documentId: string) => `${userId}:${projectId}:${documentId}`;
export function getDocumentSession(userId: string, page: DocumentPage, client: QueryClient) {
    const key = keyOf(userId, page.projectId, page.id);
    let session = sessions.get(key);
    if (!session) {
        session = new DocumentSession(page, {
            read: () => draftStore.get(key),
            write: (value) => draftStore.put({ key, userId, projectId: page.projectId, documentId: page.id, ...value }),
            remove: () => draftStore.remove(key),
            online: () => navigator.onLine,
            save: (input, signal) => saveDocument(page.projectId, page.id, input, signal),
            onSaved: (saved) => {
                client.setQueryData(documentKey(page.projectId, page.id), saved);
            client.setQueryData<DocumentSummary[]>(documentsKey(page.projectId), (old) =>
                    old?.map((item) => (item.id === saved.id ? { ...item, title: saved.title, iconAppearance: saved.iconAppearance, cover: saved.cover, updatedAt: saved.updatedAt, revision: saved.revision } : item)),
                );
            },
        });
        sessions.set(key, session);
    }
    return session;
}
export async function clearDocumentSession(userId: string, projectId: string, documentId: string) {
    const key = keyOf(userId, projectId, documentId);
    await sessions.get(key)?.pause();
    sessions.delete(key);
    await draftStore.remove(key);
}
export async function pauseDocumentSession(userId: string, projectId: string, documentId: string) {
    const session = sessions.get(keyOf(userId, projectId, documentId));
    if (!session) return undefined;
    await session.pause();
    return () => session.resume();
}
export async function clearDocumentDrafts(userId: string, projectId?: string) {
    const prefix = `${userId}:${projectId ? `${projectId}:` : ""}`;
    for (const [key, session] of sessions)
        if (key.startsWith(prefix)) {
            await session.pause();
            sessions.delete(key);
        }
    await draftStore.clearUser(userId, projectId);
}
if (typeof window !== "undefined") {
    window.addEventListener("online", () => sessions.forEach((session) => session.networkChanged()));
    window.addEventListener("offline", () => sessions.forEach((session) => session.networkChanged()));
    window.addEventListener("beforeunload", (event) => {
        if ([...sessions.values()].some((session) => session.getSnapshot().dirty)) {
            event.preventDefault();
            event.returnValue = "";
        }
    });
}
