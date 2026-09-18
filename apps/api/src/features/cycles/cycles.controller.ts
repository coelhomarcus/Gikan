import { createCycleSchema, updateCycleSchema } from "@gikan/shared";
import { asyncHandler } from "../../middleware/async-handler";
import { assertProjectMembership } from "../../middleware/project-membership.middleware";
import { createCycle, deleteCycle, getCycle, listCycles, updateCycle } from "./cycles.service";

export const list = asyncHandler<{ projectId: string }>(async (req, res) => {
    res.json({ cycles: await listCycles(req.params.projectId) });
});

export const create = asyncHandler<{ projectId: string }>(async (req, res) => {
    res.status(201).json({ cycle: await createCycle(req.params.projectId, createCycleSchema.parse(req.body)) });
});

export const update = asyncHandler<{ cycleId: string }>(async (req, res) => {
    res.json({ cycle: await updateCycle(req.params.cycleId, updateCycleSchema.parse(req.body), req.user!.sub, req.user!.isAdmin) });
});

export const remove = asyncHandler<{ cycleId: string }>(async (req, res) => {
    await deleteCycle(req.params.cycleId, req.user!.sub, req.user!.isAdmin);
    res.status(204).send();
});

export const getOne = asyncHandler<{ cycleId: string }>(async (req, res) => {
    const cycle = await getCycle(req.params.cycleId);
    await assertProjectMembership(cycle.projectId, req.user!.sub, req.user!.isAdmin);
    res.json({ cycle });
});
