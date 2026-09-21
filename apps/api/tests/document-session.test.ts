import assert from "node:assert/strict";
import { test } from "node:test";
import type { UpdateDocumentInput } from "@gikan/shared";
import type { DocumentPage } from "../../web/src/features/documents/api";
import { DocumentSession } from "../../web/src/features/documents/document-session";
import type { DocumentDraft } from "../../web/src/features/documents/draft-store";

const projectId = "11111111-1111-4111-8111-111111111111";
const documentId = "22222222-2222-4222-8222-222222222222";
const contentJson = {
  type: "doc" as const,
  content: [{ type: "paragraph", content: [{ type: "text", text: "Saved" }] }],
};
const page: DocumentPage = {
  id: documentId,
  projectId,
  title: "Notes",
  contentJson,
  iconAppearance: null,
  cover: null,
  createdBy: "33333333-3333-4333-8333-333333333333",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  revision: 1,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => (resolve = done));
  return { promise, resolve };
}

function setup(
  options: {
    draft?: DocumentDraft;
    online?: () => boolean;
    save?: (input: UpdateDocumentInput) => Promise<DocumentPage>;
  } = {},
) {
  const writes: Array<{
    title: string;
    contentJson: DocumentPage["contentJson"];
    iconAppearance?: DocumentPage["iconAppearance"];
    cover?: DocumentPage["cover"];
    revision: number;
  }> = [];
  let removed = 0;
  let saveCount = 0;
  const session = new DocumentSession(page, {
    read: async () => options.draft,
    write: async (value) => void writes.push(value),
    remove: async () => void removed++,
    save: async (input) => {
      saveCount++;
      return options.save
        ? options.save(input)
        : {
            ...page,
            title: input.title,
            contentJson: input.contentJson,
            iconAppearance: input.iconAppearance ?? null,
            cover: input.cover ?? null,
            revision: input.expectedRevision + 1,
          };
    },
    online: options.online ?? (() => true),
    onSaved: () => undefined,
  });
  return {
    session,
    writes,
    removed: () => removed,
    saveCount: () => saveCount,
  };
}

test("a recovered draft with a stale revision is preserved as a conflict", async () => {
  const { session, saveCount } = setup({
    draft: {
      key: "user:project:document",
      userId: "user",
      projectId,
      documentId,
      title: "Offline notes",
      contentJson,
      revision: 0,
    },
  });
  await session.ready;
  assert.equal(session.getSnapshot().status, "conflict");
  assert.equal(session.getSnapshot().title, "Offline notes");
  await session.flush();
  assert.equal(saveCount(), 0);
  assert.equal(session.getSnapshot().dirty, true);
});

test("edits made during an in-flight save are sent next with the acknowledged revision", async () => {
  const first = deferred<DocumentPage>();
  const second = deferred<DocumentPage>();
  const inputs: UpdateDocumentInput[] = [];
  const { session } = setup({
    save: async (input) => {
      inputs.push(input);
      return inputs.length === 1 ? first.promise : second.promise;
    },
  });
  await session.ready;
  session.edit({ title: "First version" });
  const flushing = session.flush();
  await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(inputs.length, 1);
    session.edit({ title: "Latest version" });
    const followup = session.flush();
    first.resolve({ ...page, title: "First version", revision: 2 });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(inputs.length, 2);
  assert.equal(inputs[1].title, "Latest version");
  assert.equal(inputs[1].expectedRevision, 2);
    second.resolve({ ...page, title: "Latest version", revision: 3 });
    await Promise.all([flushing, followup]);
  assert.equal(session.getSnapshot().status, "saved");
  assert.equal(session.getSnapshot().revision, 3);
  assert.equal(session.getSnapshot().dirty, false);
});

test("a network failure keeps the draft and permits an immediate retry", async () => {
  let fail = true;
  const { session, writes, removed } = setup({
    save: async (input) => {
      if (fail) {
        const error = new Error("offline response");
        Object.assign(error, { status: 500 });
        throw error;
      }
      return {
        ...page,
        title: input.title,
        revision: input.expectedRevision + 1,
      };
    },
  });
  await session.ready;
  session.edit({ title: "Draft to keep" });
  await session.flush();
  assert.equal(session.getSnapshot().status, "error");
  assert.equal(session.getSnapshot().dirty, true);
  assert.equal(writes.at(-1)?.title, "Draft to keep");
  assert.equal(removed(), 0);
  fail = false;
  await session.flush();
  assert.equal(session.getSnapshot().status, "saved");
  assert.equal(removed(), 1);
});

test("offline edits remain pending until a retry can reach the server", async () => {
  let online = false;
  const { session, saveCount } = setup({ online: () => online });
  await session.ready;
  session.edit({ title: "Offline edit" });
  assert.equal(session.getSnapshot().status, "offline");
  await session.flush();
  assert.equal(saveCount(), 0);
  online = true;
  session.networkChanged();
  await session.flush();
  assert.equal(session.getSnapshot().status, "saved");
  assert.equal(saveCount(), 1);
});

test("appearance is persisted with the same revisioned save as document content", async () => {
  const inputs: UpdateDocumentInput[] = [];
  const { session, writes } = setup({
    save: async (input) => {
      inputs.push(input);
      return { ...page, title: input.title, contentJson: input.contentJson, iconAppearance: input.iconAppearance ?? null, cover: input.cover ?? null, revision: input.expectedRevision + 1 };
    },
  });
  await session.ready;
  const cover = { url: "https://images.example.test/cover.jpg", position: { x: 25, y: 75 } };
  session.edit({ iconAppearance: { type: "emoji", value: "🚀" }, cover });
  await session.flush();
  assert.deepEqual(inputs[0].iconAppearance, { type: "emoji", value: "🚀" });
  assert.deepEqual(inputs[0].cover, cover);
  assert.deepEqual(writes.at(-1)?.cover, cover);
  assert.equal(session.getSnapshot().status, "saved");
  assert.deepEqual(session.getSnapshot().cover, cover);
});
