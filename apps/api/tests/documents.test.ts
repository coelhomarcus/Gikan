import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import { createDocumentSchema, updateDocumentSchema } from "@gikan/shared";
import { db } from "../src/db";
import { projectDocuments, projectMembers } from "../src/db/schema";
import {
  deleteDocument,
  getDocument,
  updateDocument,
} from "../src/features/documents/documents.service";
import { HttpError } from "../src/lib/http-error";

afterEach(() => mock.restoreAll());

const projectId = "11111111-1111-4111-8111-111111111111";
const documentId = "22222222-2222-4222-8222-222222222222";
const authorId = "33333333-3333-4333-8333-333333333333";
const otherId = "44444444-4444-4444-8444-444444444444";
const legacy = {
  type: "doc" as const,
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "Keep every existing node." }],
    },
  ],
};
const page = {
  id: documentId,
  projectId,
  title: "Overview notes",
  contentJson: legacy,
  createdBy: authorId,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  revision: 1,
};

function sqlParameters(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(sqlParameters);
  const record = value as Record<string, unknown>;
  return [
    ...(typeof record.value === "string" ? [record.value] : []),
    ...(Array.isArray(record.queryChunks)
      ? record.queryChunks.flatMap(sqlParameters)
      : []),
  ];
}

test("document schemas keep existing JSON and normalize empty titles", () => {
  const parsed = createDocumentSchema.parse({
    title: "  ",
    contentJson: legacy,
  });
  assert.equal(parsed.title, "Untitled");
  assert.deepEqual(parsed.contentJson, legacy);
  assert.equal(
    updateDocumentSchema.safeParse({
      title: "x",
      contentJson: legacy,
      expectedRevision: 0,
    }).success,
    false,
  );
});

test("document schemas accept URL images and reject non-HTTP schemes", () => {
  const contentJson = {
    type: "doc" as const,
    content: [
      {
        type: "image",
        attrs: { src: "https://images.example.test/a.png", alt: "A" },
      },
    ],
  };
  assert.equal(createDocumentSchema.safeParse({ contentJson }).success, true);
  assert.equal(
    createDocumentSchema.safeParse({
      contentJson: {
        ...contentJson,
        content: [
          { type: "image", attrs: { src: "data:image/png;base64,AAAA" } },
        ],
      },
    }).success,
    false,
  );
  assert.equal(
    createDocumentSchema.safeParse({
      contentJson: {
        type: "doc",
        content: [{ type: "image", attrs: { src: "" } }],
      },
    }).success,
    true,
  );
});

test("document lookup is scoped by both project and document", async () => {
  const find = mock.method(
    db.query.projectDocuments,
    "findFirst",
    async () => undefined,
  );
  await assert.rejects(
    getDocument(projectId, documentId),
    (error: unknown) => error instanceof HttpError && error.statusCode === 404,
  );
  const condition = find.mock.calls[0].arguments[0].where;
  const uuids = sqlParameters(condition).filter((value) =>
    [projectId, documentId].includes(value),
  );
  assert.deepEqual(uuids, [projectId, documentId]);
});

test("a successful revision update increments revision and preserves the supplied content", async () => {
  const replacement = {
    ...legacy,
    content: [
      { type: "paragraph", content: [{ type: "text", text: "Saved." }] },
    ],
  };
  const update = mock.method(
    db,
    "update",
    () =>
      ({
        set: (values: Record<string, unknown>) => ({
          where: (_condition: unknown) => ({
            returning: async () => [
              {
                ...page,
                title: "Updated",
                contentJson: values.contentJson,
                revision: 2,
              },
            ],
          }),
        }),
      }) as never,
  );
  const result = await updateDocument(projectId, documentId, {
    title: "Updated",
    contentJson: replacement,
    expectedRevision: 1,
  });
  assert.equal(result.revision, 2);
  assert.deepEqual(result.contentJson, replacement);
  assert.equal(update.mock.callCount(), 1);
});

test("stale revisions return 409 while missing documents return 404", async () => {
  mock.method(
    db,
    "update",
    () =>
      ({
        set: () => ({ where: () => ({ returning: async () => [] }) }),
      }) as never,
  );
  mock.method(db.query.projectDocuments, "findFirst", async () => page);
  await assert.rejects(
    updateDocument(projectId, documentId, {
      title: "New",
      contentJson: legacy,
      expectedRevision: 1,
    }),
    (error: unknown) => error instanceof HttpError && error.statusCode === 409,
  );

  mock.restoreAll();
  mock.method(
    db,
    "update",
    () =>
      ({
        set: () => ({ where: () => ({ returning: async () => [] }) }),
      }) as never,
  );
  mock.method(db.query.projectDocuments, "findFirst", async () => undefined);
  await assert.rejects(
    updateDocument(projectId, documentId, {
      title: "New",
      contentJson: legacy,
      expectedRevision: 1,
    }),
    (error: unknown) => error instanceof HttpError && error.statusCode === 404,
  );
});

test("only the author, project owner, or admin can delete a page", async () => {
  const findDocument = mock.method(
    db.query.projectDocuments,
    "findFirst",
    async () => page,
  );
  const findMembership = mock.method(
    db.query.projectMembers,
    "findFirst",
    async () => undefined,
  );
  const deleted = mock.method(
    db,
    "delete",
    () => ({ where: async () => undefined }) as never,
  );
  await assert.rejects(
    deleteDocument(projectId, documentId, otherId, false),
    (error: unknown) => error instanceof HttpError && error.statusCode === 403,
  );
  assert.equal(findDocument.mock.callCount(), 1);
  assert.equal(findMembership.mock.callCount(), 1);
  assert.equal(deleted.mock.callCount(), 0);

  findMembership.mock.mockImplementation(
    async () => ({ role: "owner" }) as typeof projectMembers.$inferSelect,
  );
  await deleteDocument(projectId, documentId, otherId, false);
  await deleteDocument(projectId, documentId, otherId, true);
  await deleteDocument(projectId, documentId, authorId, false);
  assert.equal(deleted.mock.callCount(), 3);
  assert.equal(projectDocuments.id.name, "id");
});
