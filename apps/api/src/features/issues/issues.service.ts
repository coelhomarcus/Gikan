import type { CreateIssueCommentInput, CreateIssueInput, CreateIssueRelationInput, IssueListQuery, TiptapDocument, UpdateIssueCommentInput, UpdateIssueInput } from "@gikan/shared";
import { and, asc, count, desc, eq, or, sql } from "drizzle-orm";
import { db } from "../../db";
import { boardColumns, categories, issueActivities, issueComments, issueRelations, issues, projectCycles, projectMembers, projects, users } from "../../db/schema";
import { HttpError } from "../../lib/http-error";

const EMPTY_DOCUMENT = { type: "doc" as const, content: [] };

function validateIssueImageUrls(document?: TiptapDocument) {
    if (!document) return;
    const visit = (nodes: unknown[]) => {
        for (const candidate of nodes) {
            if (!candidate || typeof candidate !== "object") continue;
            const node = candidate as { type?: unknown; attrs?: { src?: unknown }; content?: unknown[] };
            if (node.type === "image" && typeof node.attrs?.src === "string" && node.attrs.src.trim()) {
                try {
                    const url = new URL(node.attrs.src);
                    if (!(["http:", "https:"].includes(url.protocol))) throw new Error();
                } catch {
                    throw new HttpError(400, "Issue image URLs must use HTTP or HTTPS");
                }
            }
            if (Array.isArray(node.content)) visit(node.content);
        }
    };
    visit(document.content ?? []);
}

function parseIdentifier(identifier: string): { key: string; number: number } | null {
    const match = /^([A-Z0-9]{2,8})-(\d+)$/.exec(identifier.toUpperCase());
    return match ? { key: match[1], number: Number(match[2]) } : null;
}

async function findIssue(identifier: string) {
    const parsed = parseIdentifier(identifier);
    if (parsed) {
        const [match] = await db
            .select({ id: issues.id })
            .from(issues)
            .innerJoin(projects, eq(issues.projectId, projects.id))
            .where(and(eq(projects.issueKey, parsed.key), eq(issues.number, parsed.number)));
        identifier = match?.id ?? identifier;
    }

    return db.query.issues.findFirst({
        where: eq(issues.id, identifier),
        with: {
            project: { columns: { id: true, name: true, issueKey: true } },
            assignee: { columns: { id: true, name: true, username: true, avatarUrl: true } },
            createdBy: { columns: { id: true, name: true, username: true, avatarUrl: true } },
            category: { columns: { id: true, name: true, color: true } },
            column: { columns: { id: true, name: true } },
            cycle: { columns: { id: true, number: true, name: true, status: true } },
            parent: { columns: { id: true, number: true, title: true } },
            children: { columns: { id: true, number: true, title: true, columnId: true, priority: true } },
        },
    });
}

export async function getIssueOrThrow(identifier: string) {
    const issue = await findIssue(identifier);
    if (!issue) throw new HttpError(404, "Issue not found");
    return issue;
}

export function issueIdentifier(issue: { number: number; project: { issueKey: string } }) {
    return `${issue.project.issueKey}-${issue.number}`;
}

async function ensureIssueBelongsToProject(issueId: string, projectId: string) {
    const issue = await db.query.issues.findFirst({ where: and(eq(issues.id, issueId), eq(issues.projectId, projectId)), columns: { id: true } });
    if (!issue) throw new HttpError(400, "Issue does not belong to this project");
}

async function ensureColumnInProject(columnId: string, projectId: string) {
    const column = await db.query.boardColumns.findFirst({ where: and(eq(boardColumns.id, columnId), eq(boardColumns.projectId, projectId)), columns: { id: true } });
    if (!column) throw new HttpError(400, "Status does not belong to this project");
}

async function ensureProjectMember(userId: string, projectId: string) {
    const membership = await db.query.projectMembers.findFirst({
        where: and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)),
        columns: { id: true },
    });
    if (!membership) throw new HttpError(400, "User is not a member of this project");
}

async function ensureCycleInProject(cycleId: string, projectId: string) {
    const cycle = await db.query.projectCycles.findFirst({ where: and(eq(projectCycles.id, cycleId), eq(projectCycles.projectId, projectId)), columns: { id: true } });
    if (!cycle) throw new HttpError(400, "Cycle does not belong to this project");
}

async function ensureAssigneeInProject(assigneeId: string, projectId: string) {
    const member = await db.query.projectMembers.findFirst({ where: and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, assigneeId)), columns: { id: true } });
    if (!member) throw new HttpError(400, "User is not a member of this project");
}

async function ensureCategoryInProject(categoryId: string, projectId: string) {
    const category = await db.query.categories.findFirst({ where: and(eq(categories.id, categoryId), eq(categories.projectId, projectId)), columns: { id: true } });
    if (!category) throw new HttpError(400, "Category does not belong to this project");
}

async function ensureParentIsValid(parentIssueId: string, issueId: string | undefined, projectId: string) {
    if (parentIssueId === issueId) throw new HttpError(400, "An issue cannot be its own parent");
    await ensureIssueBelongsToProject(parentIssueId, projectId);

    let current = parentIssueId;
    for (let depth = 0; depth < 20; depth += 1) {
        const parent = await db.query.issues.findFirst({ where: eq(issues.id, current), columns: { parentIssueId: true } });
        if (!parent?.parentIssueId) return;
        if (parent.parentIssueId === issueId) throw new HttpError(400, "An issue cannot become its own ancestor");
        current = parent.parentIssueId;
    }
    throw new HttpError(400, "Issue nesting is too deep");
}

async function nextIssueNumber(projectId: string, tx: any = db): Promise<{ issueKey: string; number: number }> {
    const [updated] = await tx
        .update(projects)
        .set({ nextIssueNumber: sql`${projects.nextIssueNumber} + 1` })
        .where(eq(projects.id, projectId))
        .returning({ issueKey: projects.issueKey, number: projects.nextIssueNumber });
    if (!updated) throw new HttpError(404, "Project not found");
    return { issueKey: updated.issueKey, number: updated.number - 1 };
}

export async function listIssues(projectId: string, query: IssueListQuery) {
    const filters = [eq(issues.projectId, projectId)];
    if (query.columnId) filters.push(eq(issues.columnId, query.columnId));
    if (query.priority) filters.push(eq(issues.priority, query.priority));
    if (query.assigneeId) filters.push(eq(issues.assigneeId, query.assigneeId));
    if (query.categoryId) filters.push(eq(issues.categoryId, query.categoryId));
    if (query.cycleId) filters.push(eq(issues.cycleId, query.cycleId));

    const order = query.orderBy === "updated" ? desc(issues.updatedAt) : query.orderBy === "number" ? asc(issues.number) : query.orderBy === "priority" ? asc(issues.priority) : asc(issues.position);
    const rows = await db.query.issues.findMany({ where: and(...filters), orderBy: [order] });
    const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId), columns: { issueKey: true } });
    if (!project) throw new HttpError(404, "Project not found");
    return rows.map((issue) => ({ ...issue, identifier: `${project.issueKey}-${issue.number}` }));
}

export async function createIssue(projectId: string, input: CreateIssueInput, actorId: string) {
    validateIssueImageUrls(input.descriptionJson);
    await ensureProjectMember(actorId, projectId);
    if (input.parentIssueId) await ensureParentIsValid(input.parentIssueId, undefined, projectId);
    await ensureColumnInProject(input.columnId, projectId);
    if (input.assigneeId) await ensureAssigneeInProject(input.assigneeId, projectId);
    if (input.categoryId) await ensureCategoryInProject(input.categoryId, projectId);
    if (input.cycleId) await ensureCycleInProject(input.cycleId, projectId);

    const issue = await db.transaction(async (tx) => {
        const identity = await nextIssueNumber(projectId, tx);
        const [created] = await tx
            .insert(issues)
            .values({
                projectId,
                number: identity.number,
                columnId: input.columnId,
                title: input.title,
                descriptionJson: input.descriptionJson ?? EMPTY_DOCUMENT,
                categoryId: input.categoryId,
                assigneeId: input.assigneeId,
                priority: input.priority,
                parentIssueId: input.parentIssueId,
                cycleId: input.cycleId,
                estimate: input.estimate,
                createdBy: actorId,
                position: 1000,
            })
            .returning();
        await tx.insert(issueActivities).values({ issueId: created.id, actorId, type: "created", payload: {} });
        return { ...created, project: { issueKey: identity.issueKey } };
    });
    return { ...issue, identifier: issueIdentifier(issue) };
}

export async function updateIssue(identifier: string, input: UpdateIssueInput, actorId: string) {
    const current = await getIssueOrThrow(identifier);
    await ensureProjectMember(actorId, current.projectId);
    validateIssueImageUrls(input.descriptionJson);
    if (input.columnId) await ensureColumnInProject(input.columnId, current.projectId);
    if (input.assigneeId) await ensureAssigneeInProject(input.assigneeId, current.projectId);
    if (input.categoryId) await ensureCategoryInProject(input.categoryId, current.projectId);
    if (input.cycleId) await ensureCycleInProject(input.cycleId, current.projectId);
    if (input.parentIssueId) await ensureParentIsValid(input.parentIssueId, current.id, current.projectId);

    const { expectedDescriptionRevision, ...values } = input;
    const writesDescription = values.descriptionJson !== undefined;
    const [updated] = await db.update(issues)
        .set({
            ...values,
            ...(writesDescription ? { descriptionRevision: sql`${issues.descriptionRevision} + 1` } : {}),
            updatedAt: new Date(),
        })
        .where(writesDescription
            ? and(eq(issues.id, current.id), eq(issues.descriptionRevision, expectedDescriptionRevision!))
            : eq(issues.id, current.id))
        .returning();
    if (!updated && writesDescription) throw new HttpError(409, "This issue description was updated elsewhere. Your draft has been kept.");
    if (!updated) throw new HttpError(404, "Issue not found");

    const activityMap = [
        ["columnId", "status_changed"],
        ["priority", "priority_changed"],
        ["assigneeId", "assignee_changed"],
        ["categoryId", "category_changed"],
        ["cycleId", "cycle_changed"],
        ["estimate", "estimate_changed"],
        ["parentIssueId", "parent_changed"],
    ] as const;
    for (const [field, type] of activityMap) {
        if (field in input && current[field] !== input[field]) {
            await db.insert(issueActivities).values({ issueId: current.id, actorId, type, payload: { field, from: current[field], to: input[field] } });
        }
    }

    const project = await db.query.projects.findFirst({ where: eq(projects.id, current.projectId), columns: { issueKey: true } });
    return { ...updated, identifier: `${project?.issueKey}-${updated.number}` };
}

export async function deleteIssue(identifier: string, actorId: string) {
    const issue = await getIssueOrThrow(identifier);
    await ensureProjectMember(actorId, issue.projectId);
    const [{ value: children }] = await db.select({ value: count() }).from(issues).where(eq(issues.parentIssueId, issue.id));
    if (children > 0) throw new HttpError(409, "Reparent or delete the sub-issues before deleting this issue");
    await db.delete(issues).where(eq(issues.id, issue.id));
}

export async function listIssueComments(identifier: string, actorId: string) {
    const issue = await getIssueOrThrow(identifier);
    await ensureProjectMember(actorId, issue.projectId);
    return db.query.issueComments.findMany({
        where: eq(issueComments.issueId, issue.id),
        orderBy: [asc(issueComments.createdAt)],
        with: { author: { columns: { id: true, name: true, username: true, avatarUrl: true } } },
    });
}

export async function createIssueComment(identifier: string, input: CreateIssueCommentInput, authorId: string) {
    const issue = await getIssueOrThrow(identifier);
    await ensureProjectMember(authorId, issue.projectId);
    const [comment] = await db.insert(issueComments).values({ issueId: issue.id, authorId, contentJson: input.contentJson }).returning();
    return db.query.issueComments.findFirst({ where: eq(issueComments.id, comment.id), with: { author: { columns: { id: true, name: true, username: true, avatarUrl: true } } } });
}

export async function updateIssueComment(commentId: string, input: UpdateIssueCommentInput, authorId: string) {
    const comment = await db.query.issueComments.findFirst({ where: eq(issueComments.id, commentId) });
    if (!comment) throw new HttpError(404, "Comment not found");
    if (comment.authorId !== authorId) throw new HttpError(403, "Only the comment author can edit it");
    const [updated] = await db.update(issueComments).set({ contentJson: input.contentJson, updatedAt: new Date() }).where(eq(issueComments.id, commentId)).returning();
    return updated;
}

export async function deleteIssueComment(commentId: string, authorId: string) {
    const comment = await db.query.issueComments.findFirst({ where: eq(issueComments.id, commentId) });
    if (!comment) throw new HttpError(404, "Comment not found");
    if (comment.authorId !== authorId) throw new HttpError(403, "Only the comment author can delete it");
    await db.delete(issueComments).where(eq(issueComments.id, commentId));
}

export async function listIssueActivity(identifier: string, actorId: string) {
    const issue = await getIssueOrThrow(identifier);
    await ensureProjectMember(actorId, issue.projectId);
    return db.query.issueActivities.findMany({
        where: eq(issueActivities.issueId, issue.id),
        orderBy: [desc(issueActivities.createdAt)],
        with: { actor: { columns: { id: true, name: true, username: true, avatarUrl: true } } },
    });
}

export async function listIssueRelations(identifier: string, actorId: string) {
    const issue = await getIssueOrThrow(identifier);
    await ensureProjectMember(actorId, issue.projectId);
    const relations = await db.query.issueRelations.findMany({
        where: or(eq(issueRelations.sourceIssueId, issue.id), eq(issueRelations.targetIssueId, issue.id)),
        with: {
            source: { columns: { id: true, number: true, title: true, projectId: true }, with: { project: { columns: { issueKey: true } } } },
            target: { columns: { id: true, number: true, title: true, projectId: true }, with: { project: { columns: { issueKey: true } } } },
        },
    });
    return relations.map((relation) => ({ ...relation, target: relation.sourceIssueId === issue.id ? relation.target : relation.source }));
}

export async function createIssueRelation(identifier: string, input: CreateIssueRelationInput, actorId: string) {
    const source = await getIssueOrThrow(identifier);
    const target = await getIssueOrThrow(input.targetIssueIdentifier);
    await ensureProjectMember(actorId, source.projectId);
    if (source.projectId !== target.projectId) throw new HttpError(400, "Issues must belong to the same project");
    if (source.id === target.id) throw new HttpError(400, "An issue cannot relate to itself");
    const existing = await db.query.issueRelations.findFirst({ where: and(eq(issueRelations.sourceIssueId, source.id), eq(issueRelations.targetIssueId, target.id), eq(issueRelations.type, input.type)) });
    if (existing) throw new HttpError(409, "This relation already exists");
    const [relation] = await db.insert(issueRelations).values({ sourceIssueId: source.id, targetIssueId: target.id, type: input.type }).returning();
    await db.insert(issueActivities).values({ issueId: source.id, actorId, type: "relation_added", payload: { relationId: relation.id, targetIssueId: target.id, relationType: input.type } });
    return relation;
}

export async function deleteIssueRelation(relationId: string, actorId: string) {
    const relation = await db.query.issueRelations.findFirst({ where: eq(issueRelations.id, relationId) });
    if (!relation) throw new HttpError(404, "Relation not found");
    const source = await getIssueOrThrow(relation.sourceIssueId);
    await ensureProjectMember(actorId, source.projectId);
    await db.delete(issueRelations).where(eq(issueRelations.id, relationId));
    await db.insert(issueActivities).values({ issueId: source.id, actorId, type: "relation_removed", payload: { relationId, targetIssueId: relation.targetIssueId, relationType: relation.type } });
}
