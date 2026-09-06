import { Router } from "express";
import { projectCardsRouter } from "../cards/cards.routes";
import { categoriesRouter } from "../categories/categories.routes";
import { columnsRouter } from "../columns/columns.routes";
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

projectsRouter.use("/:projectId/categories", categoriesRouter);
projectsRouter.use("/:projectId/columns", columnsRouter);
projectsRouter.use("/:projectId/cards", projectCardsRouter);
