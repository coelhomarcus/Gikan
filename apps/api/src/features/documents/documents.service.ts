import type { CreateDocumentInput, UpdateDocumentInput } from "@gikan/shared";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { projectDocuments, projectMembers } from "../../db/schema";
import { HttpError } from "../../lib/http-error";

const matchingDocument = (projectId: string, documentId: string) =>
  and(
    eq(projectDocuments.projectId, projectId),
    eq(projectDocuments.id, documentId),
  );

export function listDocuments(projectId: string) {
  return db.query.projectDocuments.findMany({
    where: eq(projectDocuments.projectId, projectId),
    columns: { contentJson: false },
    orderBy: [asc(projectDocuments.createdAt), asc(projectDocuments.id)],
  });
}

export async function getDocument(projectId: string, documentId: string) {
  const document = await db.query.projectDocuments.findFirst({
    where: matchingDocument(projectId, documentId),
  });
  if (!document) throw new HttpError(404, "Document not found");
  return document;
}

export async function createDocument(
  projectId: string,
  userId: string,
  input: CreateDocumentInput,
) {
  const [document] = await db
    .insert(projectDocuments)
    .values({ projectId, createdBy: userId, ...input })
    .returning();
  return document;
}

export async function updateDocument(
  projectId: string,
  documentId: string,
  input: UpdateDocumentInput,
) {
  const [document] = await db
    .update(projectDocuments)
    .set({
      title: input.title,
      contentJson: input.contentJson,
      updatedAt: new Date(),
      revision: sql`${projectDocuments.revision} + 1`,
    })
    .where(
      and(
        matchingDocument(projectId, documentId),
        eq(projectDocuments.revision, input.expectedRevision),
      ),
    )
    .returning();
  if (document) return document;
  await getDocument(projectId, documentId);
  throw new HttpError(
    409,
    "This page was updated elsewhere. Your draft has been kept.",
  );
}

export async function deleteDocument(
  projectId: string,
  documentId: string,
  userId: string,
  isAdmin: boolean,
) {
  const document = await getDocument(projectId, documentId);
  if (!isAdmin && document.createdBy !== userId) {
    const owner = await db.query.projectMembers.findFirst({
      where: and(
        eq(projectMembers.projectId, projectId),
        eq(projectMembers.userId, userId),
        eq(projectMembers.role, "owner"),
      ),
    });
    if (!owner)
      throw new HttpError(
        403,
        "Only the author or project owner can delete this page",
      );
  }
  await db
    .delete(projectDocuments)
    .where(matchingDocument(projectId, documentId));
}
