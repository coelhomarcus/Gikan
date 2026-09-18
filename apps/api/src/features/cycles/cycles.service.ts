import type { CreateCycleInput, UpdateCycleInput } from "@gikan/shared";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { projectCycles, projectMembers } from "../../db/schema";
import { HttpError } from "../../lib/http-error";

export async function listCycles(projectId: string) {
    return db.query.projectCycles.findMany({ where: eq(projectCycles.projectId, projectId), orderBy: [asc(projectCycles.number)] });
}

export async function createCycle(projectId: string, input: CreateCycleInput) {
    const [last] = await db.select({ number: projectCycles.number }).from(projectCycles).where(eq(projectCycles.projectId, projectId)).orderBy(sql`${projectCycles.number} desc`).limit(1);
    const [cycle] = await db
        .insert(projectCycles)
        .values({ projectId, number: (last?.number ?? 0) + 1, name: input.name, status: input.status, startsAt: input.startsAt ? new Date(input.startsAt) : null, endsAt: input.endsAt ? new Date(input.endsAt) : null })
        .returning();
    return cycle;
}

export async function updateCycle(cycleId: string, input: UpdateCycleInput, userId: string, isAdmin: boolean) {
    await assertCycleOwner(cycleId, userId, isAdmin);
    const [cycle] = await db
        .update(projectCycles)
        .set({ ...input, startsAt: input.startsAt === undefined ? undefined : input.startsAt ? new Date(input.startsAt) : null, endsAt: input.endsAt === undefined ? undefined : input.endsAt ? new Date(input.endsAt) : null })
        .where(eq(projectCycles.id, cycleId))
        .returning();
    if (!cycle) throw new HttpError(404, "Cycle not found");
    return cycle;
}

async function assertCycleOwner(cycleId: string, userId: string, isAdmin: boolean) {
    const cycle = await getCycle(cycleId);
    if (isAdmin) return cycle;
    const membership = await db.query.projectMembers.findFirst({ where: and(eq(projectMembers.projectId, cycle.projectId), eq(projectMembers.userId, userId)) });
    if (!membership || membership.role !== "owner") throw new HttpError(403, "Only the project owner can manage cycles");
    return cycle;
}

export async function deleteCycle(cycleId: string, userId: string, isAdmin: boolean) {
    await assertCycleOwner(cycleId, userId, isAdmin);
    const [cycle] = await db.delete(projectCycles).where(eq(projectCycles.id, cycleId)).returning({ id: projectCycles.id });
    if (!cycle) throw new HttpError(404, "Cycle not found");
}

export async function getCycle(cycleId: string) {
    const cycle = await db.query.projectCycles.findFirst({ where: eq(projectCycles.id, cycleId) });
    if (!cycle) throw new HttpError(404, "Cycle not found");
    return cycle;
}
