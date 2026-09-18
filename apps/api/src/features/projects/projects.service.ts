import { suggestProjectKey, type CreateProjectInput, type TiptapDocument, type UpdateProjectDocumentInput, type UpdateProjectInput, type UpdateProjectPageInput } from "@gikan/shared";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { boardColumns, issues, projectDocuments, projectMembers, projects, users } from "../../db/schema";
import { HttpError } from "../../lib/http-error";

/** Initial colors for the default columns. The same hexes are used by migration 0005, which backfilled projects created before this field existed. */
const DEFAULT_COLUMNS = [
    { name: "To Do", color: "#eaaa08" },
    { name: "In Progress", color: "#7a5af8" },
    { name: "Done", color: "#17b26a" },
];

const PROJECT_LIST_COLUMNS = {
    id: true,
    name: true,
    issueKey: true,
    description: true,
    repositoryUrl: true,
    icon: true,
    createdBy: true,
    createdAt: true,
    updatedAt: true,
} as const;

async function resolveProjectKey(name: string) {
    const existing = await db.query.projects.findMany({ columns: { issueKey: true } });
    const taken = new Set(existing.map((project) => project.issueKey));

    const base = suggestProjectKey(name);
    let candidate = base;
    let suffix = 1;
    while (taken.has(candidate)) {
        const suffixText = String(suffix++);
        candidate = `${base.slice(0, 8 - suffixText.length)}${suffixText}`;
    }
    return candidate;
}

export async function createProject(input: CreateProjectInput, creatorId: string) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const issueKey = await resolveProjectKey(input.name);

        try {
            return await db.transaction(async (tx) => {
                const [project] = await tx
                    .insert(projects)
                    .values({
                        issueKey,
                        name: input.name,
                        description: input.description,
                        repositoryUrl: input.repositoryUrl,
                        icon: input.icon,
                        createdBy: creatorId,
                    })
                    .returning();

                await tx.insert(projectMembers).values({ projectId: project.id, userId: creatorId, role: "owner" });

                await tx.insert(boardColumns).values(
                    DEFAULT_COLUMNS.map((column, index) => ({
                        projectId: project.id,
                        name: column.name,
                        color: column.color,
                        position: (index + 1) * 1000,
                    })),
                );

                return project;
            });
        } catch (error) {
            const databaseError = error as { code?: string; constraint?: string };
            const keyConflict = databaseError.code === "23505" && databaseError.constraint === "projects_issue_key_unique";
            if (!keyConflict || attempt === 4) throw error;
        }
    }

    throw new HttpError(409, "Could not generate a unique project key");
}

export async function listProjectsForUser(userId: string, isAdmin: boolean) {
    if (isAdmin) {
        return db.query.projects.findMany({ columns: PROJECT_LIST_COLUMNS, orderBy: [desc(projects.createdAt)] });
    }

    const memberships = await db.query.projectMembers.findMany({
        where: eq(projectMembers.userId, userId),
        with: { project: { columns: PROJECT_LIST_COLUMNS } },
    });

    return memberships.map((membership) => membership.project);
}

export async function getProjectById(projectId: string) {
    const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) });
    if (!project) {
        throw new HttpError(404, "Project not found");
    }
    return project;
}

export async function updateProject(projectId: string, input: UpdateProjectInput) {
    if (input.issueKey) {
        const current = await getProjectById(projectId);
        const [{ value: issueCount }] = await db.select({ value: count() }).from(issues).where(eq(issues.projectId, projectId));
        if (issueCount > 0 && current.issueKey !== input.issueKey) {
            throw new HttpError(409, "Project key cannot change after the first issue is created");
        }
        const duplicate = await db.query.projects.findFirst({ where: and(eq(projects.issueKey, input.issueKey), sql`${projects.id} <> ${projectId}`), columns: { id: true } });
        if (duplicate) throw new HttpError(409, "Project key is already in use");
    }
    const [project] = await db
        .update(projects)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(projects.id, projectId))
        .returning();

    if (!project) {
        throw new HttpError(404, "Project not found");
    }
    return project;
}

export async function updateProjectPage(projectId: string, input: UpdateProjectPageInput) {
    const [project] = await db
        .update(projects)
        .set({ pageContent: input.pageContent, updatedAt: new Date() })
        .where(eq(projects.id, projectId))
        .returning();

    if (!project) {
        throw new HttpError(404, "Project not found");
    }
    return project;
}

const EMPTY_DOCUMENT: TiptapDocument = { type: "doc", content: [] };

export async function getProjectDocument(projectId: string) {
    const document = await db.query.projectDocuments.findFirst({ where: eq(projectDocuments.projectId, projectId) });
    return document ?? { id: null, projectId, contentJson: EMPTY_DOCUMENT, updatedAt: new Date().toISOString() };
}

export async function updateProjectDocument(projectId: string, input: UpdateProjectDocumentInput) {
    const [document] = await db
        .insert(projectDocuments)
        .values({ projectId, contentJson: input.contentJson, updatedAt: new Date() })
        .onConflictDoUpdate({ target: projectDocuments.projectId, set: { contentJson: input.contentJson, updatedAt: new Date() } })
        .returning();
    return document;
}

export async function deleteProject(projectId: string) {
    const [deleted] = await db.delete(projects).where(eq(projects.id, projectId)).returning({ id: projects.id });
    if (!deleted) {
        throw new HttpError(404, "Project not found");
    }
}

export async function listProjectMembers(projectId: string) {
    const members = await db.query.projectMembers.findMany({
        where: eq(projectMembers.projectId, projectId),
        with: { user: { columns: { id: true, name: true, username: true, email: true, avatarUrl: true } } },
    });

    return members.map((member) => ({ ...member.user, role: member.role, joinedAt: member.joinedAt }));
}

export async function addProjectMember(projectId: string, username: string) {
    const user = await db.query.users.findFirst({
        where: eq(users.username, username),
        columns: { id: true, name: true, username: true, email: true, avatarUrl: true },
    });

    if (!user) {
        throw new HttpError(404, "User not found");
    }

    const existing = await db.query.projectMembers.findFirst({
        where: and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, user.id)),
    });

    if (existing) {
        throw new HttpError(409, "User is already a member of this project");
    }

    const [member] = await db
        .insert(projectMembers)
        .values({ projectId, userId: user.id, role: "member" })
        .returning();

    return { ...user, role: member.role, joinedAt: member.joinedAt };
}

export async function removeProjectMember(projectId: string, userId: string) {
    const target = await db.query.projectMembers.findFirst({
        where: and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)),
    });

    if (!target) {
        throw new HttpError(404, "Member not found");
    }
    if (target.role === "owner") {
        throw new HttpError(400, "The project owner cannot be removed");
    }

    await db.delete(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));
}
