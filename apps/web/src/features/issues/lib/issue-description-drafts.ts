import type { TiptapDocument } from "@gikan/shared";

interface IssueDescriptionDraft {
    key: string;
    userId: string;
    projectId: string;
    issueId: string;
    baseRevision?: number;
    descriptionJson?: TiptapDocument;
    commentJson?: TiptapDocument;
    updatedAt: number;
}

let database: Promise<IDBDatabase> | undefined;
function openDatabase() {
    return (database ??= new Promise((resolve, reject) => {
        const request = indexedDB.open("gikan-issue-description-drafts", 1);
        request.onupgradeneeded = () => request.result.createObjectStore("drafts", { keyPath: "key" });
        request.onsuccess = () => {
            request.result.onversionchange = () => {
                request.result.close();
                database = undefined;
            };
            resolve(request.result);
        };
        request.onerror = () => {
            database = undefined;
            reject(request.error);
        };
        request.onblocked = () => {
            database = undefined;
            reject(new Error("Issue draft storage is blocked by another tab."));
        };
    }));
}

function tabId() {
    const key = "gikan-issue-draft-tab-id";
    try {
        let value = sessionStorage.getItem(key);
        if (!value) {
            value = crypto.randomUUID();
            sessionStorage.setItem(key, value);
        }
        return value;
    } catch {
        return "default";
    }
}

function request<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    return openDatabase().then((db) => new Promise<T>((resolve, reject) => {
        const transaction = db.transaction("drafts", mode);
        const result = action(transaction.objectStore("drafts"));
        transaction.oncomplete = () => resolve(result.result);
        transaction.onabort = () => reject(transaction.error ?? result.error);
        transaction.onerror = () => reject(transaction.error ?? result.error);
    }));
}

let queue: Promise<unknown> = Promise.resolve();
const signedOutUsers = new Set<string>();
const deletedIssueScopes = new Set<string>();

function scopeKey(userId: string, projectId: string, issueId: string) {
    return `${userId}:${projectId}:${issueId}`;
}
function ordered<T>(operation: () => Promise<T>): Promise<T> {
    const current = queue.then(operation, operation);
    queue = current.catch(() => undefined);
    return current;
}

export function issueDraftKey(userId: string, projectId: string, issueId: string) {
    signedOutUsers.delete(userId);
    return `${userId}:${projectId}:${issueId}:${tabId()}`;
}

export const issueDescriptionDrafts = {
    get(key: string) {
        return ordered(() => request<IssueDescriptionDraft | undefined>("readonly", (store) => store.get(key)));
    },
    putDescription(draft: IssueDescriptionDraft) {
        if (signedOutUsers.has(draft.userId) || deletedIssueScopes.has(scopeKey(draft.userId, draft.projectId, draft.issueId))) return Promise.resolve();
        return ordered(async () => {
            const current = await request<IssueDescriptionDraft | undefined>("readonly", (store) => store.get(draft.key));
            return request("readwrite", (store) => store.put({ ...current, ...draft }));
        });
    },
    putComment(draft: IssueDescriptionDraft) {
        if (signedOutUsers.has(draft.userId) || deletedIssueScopes.has(scopeKey(draft.userId, draft.projectId, draft.issueId))) return Promise.resolve();
        return ordered(async () => {
            const current = await request<IssueDescriptionDraft | undefined>("readonly", (store) => store.get(draft.key));
            return request("readwrite", (store) => store.put({ ...current, ...draft }));
        });
    },
    clearDescription(key: string) {
        return ordered(async () => {
            const current = await request<IssueDescriptionDraft | undefined>("readonly", (store) => store.get(key));
            if (!current?.commentJson) return request("readwrite", (store) => store.delete(key));
            const commentDraft = { ...current };
            delete commentDraft.descriptionJson;
            delete commentDraft.baseRevision;
            return request("readwrite", (store) => store.put(commentDraft));
        });
    },
    clearComment(key: string) {
        return ordered(async () => {
            const current = await request<IssueDescriptionDraft | undefined>("readonly", (store) => store.get(key));
            if (!current?.descriptionJson) return request("readwrite", (store) => store.delete(key));
            const descriptionDraft = { ...current };
            delete descriptionDraft.commentJson;
            return request("readwrite", (store) => store.put(descriptionDraft));
        });
    },
    remove(key: string) {
        return ordered(() => request("readwrite", (store) => store.delete(key)));
    },
    clearIssue(userId: string, projectId: string, issueId: string) {
        deletedIssueScopes.add(scopeKey(userId, projectId, issueId));
        return ordered(async () => {
            const drafts = await request<IssueDescriptionDraft[]>("readonly", (store) => store.getAll());
            for (const draft of drafts) {
                if (draft.userId === userId && draft.projectId === projectId && draft.issueId === issueId) {
                    await request("readwrite", (store) => store.delete(draft.key));
                }
            }
        });
    },
    async clearUser(userId: string) {
        signedOutUsers.add(userId);
        return ordered(async () => {
            const drafts = await request<IssueDescriptionDraft[]>("readonly", (store) => store.getAll());
            for (const draft of drafts) {
                if (draft.userId === userId) await request("readwrite", (store) => store.delete(draft.key));
            }
        });
    },
};
