import { resolveLocale, suggestProjectKey, type CreateProjectInput, type Locale, type UpdateProjectInput, type UpdateProjectPageInput } from "@gikan/shared";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../db";
import { boardColumns, issues, projectMembers, projects, users } from "../../db/schema";
import { HttpError } from "../../lib/http-error";
import { isProjectKeyConflict } from "./project-key";

/** Initial colors for the default columns. The same hexes are used by migration 0005, which backfilled projects created before this field existed. */
const DEFAULT_COLUMNS: Record<Locale, Array<{ name: string; color: string }>> = {
    en: [
        { name: "To Do", color: "#eaaa08" },
        { name: "In Progress", color: "#7a5af8" },
        { name: "Done", color: "#17b26a" },
    ],
    "pt-BR": [
        { name: "A fazer", color: "#eaaa08" },
        { name: "Em andamento", color: "#7a5af8" },
        { name: "Concluído", color: "#17b26a" },
    ],
};

const PROJECT_LIST_COLUMNS = {
    id: true,
    name: true,
    issueKey: true,
    description: true,
    repositoryUrl: true,
    icon: true,
    iconAppearance: true,
    cover: true,
    createdBy: true,
    createdAt: true,
    updatedAt: true,
} as const;

type ProjectAppearanceInput = Pick<CreateProjectInput, "icon" | "iconAppearance" | "cover">;

function projectAppearance(input: ProjectAppearanceInput) {
    if (input.iconAppearance !== undefined) {
        return {
            iconAppearance: input.iconAppearance,
            // Preserve the old field for older clients only when this is a catalog icon.
            icon: input.iconAppearance?.type === "icon" ? input.iconAppearance.key : null,
        };
    }
    return input.icon === undefined ? {} : { icon: input.icon, iconAppearance: input.icon ? { type: "icon" as const, key: input.icon } : null };
}

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
    const creator = await db.query.users.findFirst({ where: eq(users.id, creatorId), columns: { locale: true } });
    const locale: Locale = resolveLocale(creator?.locale);
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const issueKey = input.issueKey ?? await resolveProjectKey(input.name);

        try {
            return await db.transaction(async (tx) => {
                const { icon: _icon, iconAppearance: _iconAppearance, cover, issueKey: _inputIssueKey, ...projectInput } = input;
                const [project] = await tx
                    .insert(projects)
                    .values({
                        issueKey,
                        ...projectInput,
                        cover: cover ?? null,
                        ...projectAppearance(input),
                        createdBy: creatorId,
                    })
                    .returning();

                await tx.insert(projectMembers).values({ projectId: project.id, userId: creatorId, role: "owner" });

                await tx.insert(boardColumns).values(
                    DEFAULT_COLUMNS[locale].map((column, index) => ({
                        projectId: project.id,
                        name: column.name,
                        color: column.color,
                        position: (index + 1) * 1000,
                    })),
                );

                return project;
            });
        } catch (error) {
            if (!isProjectKeyConflict(error)) throw error;
            if (input.issueKey) throw new HttpError(409, "Project key is already in use");
        }
    }

    throw new HttpError(409, "Could not generate a unique project key");
}

export async function listProjectsForUser(userId: string, isAdmin: boolean) {
    const projectList = isAdmin
        ? await db.query.projects.findMany({ columns: PROJECT_LIST_COLUMNS, orderBy: [desc(projects.createdAt)] })
        : (await db.query.projectMembers.findMany({
              where: eq(projectMembers.userId, userId),
              with: { project: { columns: PROJECT_LIST_COLUMNS } },
          })).map((membership) => membership.project);

    if (projectList.length === 0) return projectList.map((project) => ({ ...project, memberCount: 0, memberPreview: [] }));
    const projectIds = projectList.map((project) => project.id);
    const memberships = await db.query.projectMembers.findMany({
        where: inArray(projectMembers.projectId, projectIds),
        orderBy: [projectMembers.joinedAt],
        with: { user: { columns: { id: true, name: true, avatarUrl: true } } },
    });
    const memberMap = new Map<string, Array<{ id: string; name: string; avatarUrl: string | null }>>();
    for (const membership of memberships) {
        const members = memberMap.get(membership.projectId) ?? [];
        members.push(membership.user);
        memberMap.set(membership.projectId, members);
    }
    return projectList.map((project) => {
        const members = memberMap.get(project.id) ?? [];
        return { ...project, memberCount: members.length, memberPreview: members.slice(0, 3) };
    });
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
    const { icon: _icon, iconAppearance: _iconAppearance, cover: _cover, ...projectInput } = input;
    const [project] = await db
        .update(projects)
        .set({
            ...projectInput,
            ...(input.cover === undefined ? {} : { cover: input.cover }),
            ...projectAppearance(input),
            updatedAt: new Date(),
        })
        .where(eq(projects.id, projectId))
        .returning()
        .catch((error: unknown) => {
            if (isProjectKeyConflict(error)) throw new HttpError(409, "Project key is already in use");
            throw error;
        });

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
