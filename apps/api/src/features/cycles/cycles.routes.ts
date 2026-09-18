import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireProjectMember, requireProjectOwner } from "../../middleware/project-membership.middleware";
import { create, getOne, list, remove, update } from "./cycles.controller";

export const projectCyclesRouter = Router({ mergeParams: true });
projectCyclesRouter.use(requireProjectMember);
projectCyclesRouter.get("/", list);
projectCyclesRouter.post("/", requireProjectOwner, create);

export const cyclesRouter = Router();
cyclesRouter.use(requireAuth);
cyclesRouter.get("/:cycleId", getOne);
cyclesRouter.patch("/:cycleId", update);
cyclesRouter.delete("/:cycleId", remove);
