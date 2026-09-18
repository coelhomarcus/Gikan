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
        throw new HttpError(404, "Project not found");
    }
}

function findMembership(projectId: string, userId: string) {
    return db.query.projectMembers.findFirst({
        where: and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)),
    });
}

/** Ad hoc membership check for routes without `:projectId` in the URL (e.g. /api/cards/:cardId), where the project is discovered from the resource itself. */
export async function assertProjectMembership(projectId: string, userId: string, isAdmin: boolean): Promise<void> {
    if (isAdmin) {
        return;
    }

    const membership = await findMembership(projectId, userId);
    if (!membership) {
        throw new HttpError(403, "You are not a member of this project");
    }
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
        res.status(403).json({ error: "You are not a member of this project" });
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
        res.status(403).json({ error: "Only the project owner can do this" });
        return;
    }

    req.projectMembership = membership;
    next();
});
