import type { CreateProjectInput, UpdateProjectInput } from "@gikan/shared";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../../db";
import { boardColumns, projectMembers, projects, users } from "../../db/schema";
import { HttpError } from "../../lib/http-error";

const DEFAULT_COLUMN_NAMES = ["A Fazer", "Em Progresso", "Concluído"];

export async function createProject(input: CreateProjectInput, creatorId: string) {
    return db.transaction(async (tx) => {
        const [project] = await tx
            .insert(projects)
            .values({ name: input.name, description: input.description, repositoryUrl: input.repositoryUrl, createdBy: creatorId })
            .returning();

        await tx.insert(projectMembers).values({ projectId: project.id, userId: creatorId, role: "owner" });

        await tx.insert(boardColumns).values(
            DEFAULT_COLUMN_NAMES.map((name, index) => ({
                projectId: project.id,
                name,
                position: (index + 1) * 1000,
            })),
        );

        return project;
    });
}

export async function listProjectsForUser(userId: string, isAdmin: boolean) {
    if (isAdmin) {
        return db.query.projects.findMany({ orderBy: [desc(projects.createdAt)] });
    }

    const memberships = await db.query.projectMembers.findMany({
        where: eq(projectMembers.userId, userId),
        with: { project: true },
    });

    return memberships.map((membership) => membership.project);
}

export async function getProjectById(projectId: string) {
    const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) });
    if (!project) {
        throw new HttpError(404, "Projeto não encontrado");
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
        throw new HttpError(404, "Projeto não encontrado");
    }
    return project;
}

export async function deleteProject(projectId: string) {
    const [deleted] = await db.delete(projects).where(eq(projects.id, projectId)).returning({ id: projects.id });
    if (!deleted) {
        throw new HttpError(404, "Projeto não encontrado");
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
        throw new HttpError(404, "Usuário não encontrado");
    }

    const existing = await db.query.projectMembers.findFirst({
        where: and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, user.id)),
    });

    if (existing) {
        throw new HttpError(409, "Usuário já é membro deste projeto");
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
        throw new HttpError(404, "Membro não encontrado");
    }
    if (target.role === "owner") {
        throw new HttpError(400, "Não é possível remover o owner do projeto");
    }

    await db.delete(projectMembers).where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));
}
