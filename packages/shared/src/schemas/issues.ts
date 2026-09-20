import { z } from "zod";

export const tiptapNodeSchema = z.record(z.unknown());
export const tiptapDocumentSchema = z.object({
    type: z.literal("doc"),
    content: z.array(tiptapNodeSchema).default([]),
});
export type TiptapDocument = z.infer<typeof tiptapDocumentSchema>;

export const issuePriorityValues = ["low", "medium", "high"] as const;
export const issueRelationValues = ["blocks", "blocked_by", "related", "duplicate"] as const;
export const cycleStatusValues = ["planned", "active", "completed"] as const;
export const issueEstimateValues = [1, 2, 3, 5, 8] as const;
const estimateSchema = z.number().int().refine((value) => issueEstimateValues.includes(value as (typeof issueEstimateValues)[number]), "Estimate must be 1, 2, 3, 5, or 8");

export const createIssueSchema = z.object({
    columnId: z.string().uuid(),
    title: z.string().trim().min(1).max(200),
    descriptionJson: tiptapDocumentSchema.optional(),
    categoryId: z.string().uuid().nullable().optional(),
    assigneeId: z.string().uuid().nullable().optional(),
    priority: z.enum(issuePriorityValues).default("medium"),
    parentIssueId: z.string().uuid().nullable().optional(),
    cycleId: z.string().uuid().nullable().optional(),
    estimate: estimateSchema.nullable().optional(),
});
export type CreateIssueInput = z.infer<typeof createIssueSchema>;

export const updateIssueSchema = z
    .object({
        title: z.string().trim().min(1).max(200).optional(),
        descriptionJson: tiptapDocumentSchema.optional(),
        expectedDescriptionRevision: z.number().int().nonnegative().optional(),
        columnId: z.string().uuid().optional(),
        position: z.number().finite().optional(),
        categoryId: z.string().uuid().nullable().optional(),
        assigneeId: z.string().uuid().nullable().optional(),
        priority: z.enum(issuePriorityValues).optional(),
        parentIssueId: z.string().uuid().nullable().optional(),
        cycleId: z.string().uuid().nullable().optional(),
        estimate: estimateSchema.nullable().optional(),
    })
    .strict()
    .superRefine((value, context) => {
        if (value.descriptionJson !== undefined && value.expectedDescriptionRevision === undefined) {
            context.addIssue({ code: z.ZodIssueCode.custom, path: ["expectedDescriptionRevision"], message: "Expected description revision is required" });
        }
        if (value.descriptionJson === undefined && value.expectedDescriptionRevision !== undefined) {
            context.addIssue({ code: z.ZodIssueCode.custom, path: ["expectedDescriptionRevision"], message: "Description revision requires a description update" });
        }
    });
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;

export const issueListQuerySchema = z.object({
    columnId: z.string().uuid().optional(),
    priority: z.enum(issuePriorityValues).optional(),
    assigneeId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    cycleId: z.string().uuid().optional(),
    groupBy: z.enum(["status", "assignee", "cycle"]).optional(),
    orderBy: z.enum(["position", "priority", "updated", "number"]).default("position"),
});
export type IssueListQuery = z.infer<typeof issueListQuerySchema>;

export const createIssueCommentSchema = z.object({ contentJson: tiptapDocumentSchema });
export const updateIssueCommentSchema = createIssueCommentSchema;
export type CreateIssueCommentInput = z.infer<typeof createIssueCommentSchema>;
export type UpdateIssueCommentInput = z.infer<typeof updateIssueCommentSchema>;

export const createIssueRelationSchema = z.object({
    targetIssueIdentifier: z.string().trim().min(3).max(32),
    type: z.enum(issueRelationValues),
});
export type CreateIssueRelationInput = z.infer<typeof createIssueRelationSchema>;

export const createCycleSchema = z.object({
    name: z.string().trim().min(1).max(120),
    status: z.enum(cycleStatusValues).default("planned"),
    startsAt: z.string().datetime().nullable().optional(),
    endsAt: z.string().datetime().nullable().optional(),
});
export const updateCycleSchema = createCycleSchema.partial();
export type CreateCycleInput = z.infer<typeof createCycleSchema>;
export type UpdateCycleInput = z.infer<typeof updateCycleSchema>;

export const updateProjectDocumentSchema = z.object({ contentJson: tiptapDocumentSchema });
export type UpdateProjectDocumentInput = z.infer<typeof updateProjectDocumentSchema>;
