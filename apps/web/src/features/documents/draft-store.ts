import type { TiptapDocument } from "@gikan/shared";

export interface DocumentDraft {
    key: string;
    userId: string;
    projectId: string;
    documentId: string;
    title: string;
    contentJson: TiptapDocument;
    revision: number;
}

let database: Promise<IDBDatabase> | undefined;
function openDatabase() {
    return (database ??= new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open("gikan-document-drafts", 1);
        request.onupgradeneeded = () => request.result.createObjectStore("drafts", { keyPath: "key" });
        request.onsuccess = () => {
            request.result.onversionchange = () => {
                request.result.close();
                database = undefined;
            };
            resolve(request.result);
        };
        request.onblocked = () => {
            database = undefined;
            reject(new Error("Local document storage is blocked by another tab."));
        };
        request.onerror = () => {
            database = undefined;
            reject(request.error);
        };
    }));
}

async function transaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
        const tx = db.transaction("drafts", mode);
        const request = action(tx.objectStore("drafts"));
        tx.oncomplete = () => resolve(request.result);
        tx.onabort = () => reject(tx.error ?? request.error);
        tx.onerror = () => reject(tx.error ?? request.error);
    });
}

// One queue ensures a late write cannot resurrect a cleared/saved draft.
let queue: Promise<unknown> = Promise.resolve();
function ordered<T>(operation: () => Promise<T>): Promise<T> {
    const next = queue.then(operation, operation);
    queue = next.catch(() => undefined);
    return next;
}
export const draftStore = {
    get: (key: string): Promise<DocumentDraft | undefined> => ordered(() => transaction("readonly", (store) => store.get(key))),
    put: (draft: DocumentDraft) => ordered(() => transaction("readwrite", (store) => store.put(draft))),
    remove: (key: string) => ordered(() => transaction("readwrite", (store) => store.delete(key))),
    clearUser: (userId: string, projectId?: string) =>
        ordered(async () => {
            const entries = await transaction<DocumentDraft[]>("readonly", (store) => store.getAll());
            for (const draft of entries) {
                if (draft.userId === userId && (!projectId || draft.projectId === projectId))
                    await transaction("readwrite", (store) => store.delete(draft.key));
            }
        }),
};
