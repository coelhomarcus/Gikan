import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { projectMembers, projects } from "../db/schema";
import { HttpError } from "../lib/http-error";
import { asyncHandler } from "./async-handler";

async function ensureProjectExists(projectId: string): Promise<void> {
    const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
        columns: { id: true },
    });

    if (!project) {
        throw new HttpError(404, "Projeto não encontrado");
    }
}

function findMembership(projectId: string, userId: string) {
    return db.query.projectMembers.findFirst({
        where: and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)),
    });
}

export const requireProjectMember = asyncHandler<{ projectId: string }>(async (req, res, next) => {
    const { projectId } = req.params;
    await ensureProjectExists(projectId);

    if (req.user!.isAdmin) {
        next();
        return;
    }

    const membership = await findMembership(projectId, req.user!.sub);
    if (!membership) {
        res.status(403).json({ error: "Você não é membro deste projeto" });
        return;
    }

    req.projectMembership = membership;
    next();
});

export const requireProjectOwner = asyncHandler<{ projectId: string }>(async (req, res, next) => {
    const { projectId } = req.params;
    await ensureProjectExists(projectId);

    if (req.user!.isAdmin) {
        next();
        return;
    }

    const membership = await findMembership(projectId, req.user!.sub);
    if (!membership || membership.role !== "owner") {
        res.status(403).json({ error: "Apenas o owner do projeto pode fazer isso" });
        return;
    }

    req.projectMembership = membership;
    next();
});
