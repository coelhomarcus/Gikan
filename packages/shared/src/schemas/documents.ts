import { z } from "zod";
import { coverSchema, entityIconSchema } from "./appearance";
import { tiptapDocumentSchema } from "./issues";

const documentTitle = z
    .string()
    .trim()
    .max(200);
// Preserve arbitrary existing Tiptap nodes; only enforce the URL-only image contract.
const documentContentSchema = tiptapDocumentSchema.superRefine(
  (document, context) => {
    const pending: unknown[] = [...document.content];
    while (pending.length) {
      const value = pending.pop();
      if (!value || typeof value !== "object") continue;
      const node = value as Record<string, unknown>;
      if (Array.isArray(node.content)) pending.push(...node.content);
      if (node.type !== "image") continue;
      const attrs = node.attrs as Record<string, unknown> | undefined;
      if (!attrs?.src) continue; // An unfinished image block can be saved and completed later.
      const src = z.string().url().safeParse(String(attrs.src));
      if (!src.success || !/^https?:\/\//i.test(src.data)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Images require an HTTP or HTTPS URL.",
        });
        return;
      }
    }
  },
);
export const createDocumentSchema = z.object({
  title: documentTitle.optional(),
  contentJson: documentContentSchema.default({ type: "doc", content: [] }),
  iconAppearance: entityIconSchema.nullable().optional(),
  cover: coverSchema.nullable().optional(),
});
export const updateDocumentSchema = z.object({
  title: documentTitle,
  contentJson: documentContentSchema,
  iconAppearance: entityIconSchema.nullable().optional(),
  cover: coverSchema.nullable().optional(),
  expectedRevision: z.number().int().positive(),
});
export const documentParamsSchema = z.object({
  projectId: z.string().uuid(),
  documentId: z.string().uuid(),
});
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
