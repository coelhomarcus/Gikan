import type { CreateProjectInput, UpdateProjectInput, UpdateProjectPageInput } from "@gikan/shared";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db";
import { boardColumns, projectMembers, projects, users } from "../../db/schema";
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
    description: true,
    repositoryUrl: true,
    icon: true,
    createdBy: true,
    createdAt: true,
    updatedAt: true,
} as const;

export async function createProject(input: CreateProjectInput, creatorId: string) {
    return db.transaction(async (tx) => {
        const [project] = await tx
            .insert(projects)
            .values({ name: input.name, description: input.description, repositoryUrl: input.repositoryUrl, icon: input.icon, createdBy: creatorId })
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
