import type { TiptapDocument, UpdateDocumentInput } from "@gikan/shared";
import type { DocumentPage } from "./api";
import type { DocumentDraft } from "./draft-store";

export type SaveStatus = "loading" | "saved" | "pending" | "saving" | "offline" | "error" | "conflict" | "deleted";
export interface SessionState {
    title: string;
    contentJson: TiptapDocument;
    revision: number;
    contentVersion: number;
    status: SaveStatus;
    dirty: boolean;
    error?: string;
    storageError?: string;
}
interface Dependencies {
    read: () => Promise<DocumentDraft | undefined>;
    write: (value: Pick<DocumentDraft, "title" | "contentJson" | "revision">) => Promise<unknown>;
    remove: () => Promise<unknown>;
    save: (input: UpdateDocumentInput, signal: AbortSignal) => Promise<DocumentPage>;
    online: () => boolean;
    onSaved: (page: DocumentPage) => void;
}
const equivalent = (a: { title: string; contentJson: TiptapDocument }, b: { title: string; contentJson: TiptapDocument }) =>
    a.title === b.title && JSON.stringify(a.contentJson) === JSON.stringify(b.contentJson);

/** Route-independent single-flight saves. The revision always belongs to the last server acknowledgement. */
export class DocumentSession {
    private state: SessionState;
    private listeners = new Set<() => void>();
    private timer?: ReturnType<typeof setTimeout>;
    private flight?: Promise<void>;
    private controller?: AbortController;
    private generation = 0;
    private changes = 0;
    private lastEditAt = Date.now();
    private suspended = false;
    readonly ready: Promise<void>;

    constructor(
        page: DocumentPage,
        private deps: Dependencies,
    ) {
        this.state = { title: page.title, contentJson: page.contentJson, revision: page.revision, contentVersion: 0, status: "loading", dirty: false };
        this.ready = this.restore(page);
    }
    getSnapshot = () => this.state;
    subscribe = (listener: () => void) => {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    };
    private emit(patch: Partial<SessionState>) {
        this.state = { ...this.state, ...patch };
        this.listeners.forEach((listener) => listener());
    }
    private async restore(page: DocumentPage) {
        try {
            const draft = await this.deps.read();
            if (this.suspended) return;
            if (draft && !equivalent(draft, page)) {
                this.emit({
                    title: draft.title,
                    contentJson: draft.contentJson,
                    revision: draft.revision,
                    dirty: true,
                    status: draft.revision === page.revision ? "pending" : "conflict",
                });
                if (this.state.status === "pending") this.schedule();
            } else {
                if (draft) await this.deps.remove();
                this.emit({ status: "saved" });
            }
        } catch {
            this.emit({ status: "saved", storageError: "documents.localDraftUnavailable" });
        }
    }
    private persist() {
        const { title, contentJson, revision } = this.state;
        void this.deps
            .write({ title, contentJson, revision })
            .catch(() => this.emit({ storageError: "documents.localDraftFailed" }));
    }
    edit(patch: { title?: string; contentJson?: TiptapDocument }) {
        if (this.suspended || this.state.status === "loading" || this.state.status === "deleted") return;
        this.changes++;
        this.lastEditAt = Date.now();
        this.emit({ ...patch, dirty: true, error: undefined, status: this.state.status === "conflict" ? "conflict" : this.flight ? "saving" : "pending" });
        this.persist();
        this.schedule();
    }
    private schedule() {
        clearTimeout(this.timer);
        if (this.state.status === "conflict" || this.suspended) return;
        if (!this.deps.online()) {
            this.emit({ status: "offline" });
            return;
        }
        this.timer = setTimeout(
            () => {
                void this.flush(false);
            },
            Math.max(0, 1000 - (Date.now() - this.lastEditAt)),
        );
    }
    async flush(immediate = true): Promise<void> {
        await this.ready;
        clearTimeout(this.timer);
        if (this.flight) {
            await this.flight;
            if (this.state.status === "pending") return this.flush(immediate);
            return;
        }
        if (this.suspended || !this.state.dirty || this.state.status === "conflict" || this.state.status === "deleted") return;
        if (!immediate && Date.now() - this.lastEditAt < 1000) {
            this.schedule();
            return;
        }
        if (!this.deps.online()) {
            this.emit({ status: "offline" });
            return;
        }
        const changes = this.changes,
            generation = this.generation;
        const input = { title: this.state.title, contentJson: this.state.contentJson, expectedRevision: this.state.revision };
        this.controller = new AbortController();
        this.emit({ status: "saving", error: undefined });
        this.flight = (async () => {
            try {
                const page = await this.deps.save(input, this.controller!.signal);
                if (generation !== this.generation) return;
                this.deps.onSaved(page);
                if (changes === this.changes) {
                    this.emit({ title: page.title, revision: page.revision, dirty: false, status: "saved" });
                    await this.deps.remove().catch(() => this.emit({ storageError: "documents.draftClearFailed" }));
                } else {
                    this.emit({ revision: page.revision, status: "pending" });
                    this.persist();
                }
            } catch (error) {
                if (generation !== this.generation) return;
                const status = (error as { status?: number }).status;
                this.emit({
                    status: status === 409 ? "conflict" : status === 404 ? "deleted" : !this.deps.online() ? "offline" : "error",
                    error: typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
                        ? error.code
                        : "documents.couldNotSave",
                });
            } finally {
                this.flight = undefined;
                if (generation === this.generation && this.state.dirty && this.state.status === "saving") this.emit({ status: "pending" });
                if (this.state.status === "pending" && !this.suspended) this.schedule();
            }
        })();
        await this.flight;
    }
    async pause() {
        await this.ready;
        this.suspended = true;
        clearTimeout(this.timer);
        this.generation++;
        this.controller?.abort();
        await this.flight;
    }
    resume() {
        this.suspended = false;
        if (this.state.dirty) this.schedule();
    }
    observe(page: DocumentPage) {
        if (this.suspended || this.flight || this.state.status === "loading" || page.revision <= this.state.revision) return;
        if (this.state.dirty) this.emit({ status: "conflict" });
        else this.emit({ title: page.title, contentJson: page.contentJson, revision: page.revision, contentVersion: this.state.contentVersion + 1, status: "saved" });
    }
    async discard(page: DocumentPage) {
        await this.pause();
        await this.deps.remove();
        this.emit({ title: page.title, contentJson: page.contentJson, revision: page.revision, contentVersion: this.state.contentVersion + 1, dirty: false, status: "saved", error: undefined });
        this.suspended = false;
    }
    networkChanged() {
        if (!this.suspended && this.state.dirty && this.state.status !== "conflict" && this.state.status !== "deleted") this.schedule();
    }
}
