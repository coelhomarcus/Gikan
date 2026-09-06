import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireProjectMember, requireProjectOwner } from "../../middleware/project-membership.middleware";
import { addMember, create, getOne, list, listMembers, remove, removeMember, update } from "./projects.controller";

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

projectsRouter.get("/", list);
projectsRouter.post("/", create);

projectsRouter.get("/:projectId", requireProjectMember, getOne);
projectsRouter.patch("/:projectId", requireProjectOwner, update);
projectsRouter.delete("/:projectId", requireProjectOwner, remove);

projectsRouter.get("/:projectId/members", requireProjectMember, listMembers);
projectsRouter.post("/:projectId/members", requireProjectOwner, addMember);
projectsRouter.delete("/:projectId/members/:userId", requireProjectOwner, removeMember);
