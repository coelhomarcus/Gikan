import { Router } from "express";
import { documentParamsSchema } from "@gikan/shared";
import { asyncHandler } from "../../middleware/async-handler";
import { documentsRouter } from "../documents/documents.routes";
import { projectIssuesRouter } from "../issues/issues.routes";
import { projectCyclesRouter } from "../cycles/cycles.routes";
import { categoriesRouter } from "../categories/categories.routes";
import { columnsRouter } from "../columns/columns.routes";
import { requireAuth } from "../../middleware/auth.middleware";
import {
  requireProjectMember,
  requireProjectOwner,
} from "../../middleware/project-membership.middleware";
import {
  addMember,
  create,
  getOne,
  list,
  listMembers,
  remove,
  removeMember,
  update,
  updatePage,
} from "./projects.controller";

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

projectsRouter.get("/", list);
projectsRouter.post("/", create);

projectsRouter.get("/:projectId", requireProjectMember, getOne);
projectsRouter.patch("/:projectId", requireProjectOwner, update);
projectsRouter.delete("/:projectId", requireProjectOwner, remove);
projectsRouter.patch("/:projectId/page", requireProjectMember, updatePage);
projectsRouter.use(
  "/:projectId/documents",
  asyncHandler<{ projectId: string }>(async (req, _res, next) => {
    documentParamsSchema.shape.projectId.parse(req.params.projectId);
    next();
  }),
  requireProjectMember,
  documentsRouter,
);

projectsRouter.get("/:projectId/members", requireProjectMember, listMembers);
projectsRouter.post("/:projectId/members", requireProjectOwner, addMember);
projectsRouter.delete(
  "/:projectId/members/:userId",
  requireProjectOwner,
  removeMember,
);

projectsRouter.use("/:projectId/categories", categoriesRouter);
projectsRouter.use("/:projectId/columns", columnsRouter);
projectsRouter.use("/:projectId/issues", projectIssuesRouter);
projectsRouter.use("/:projectId/cycles", projectCyclesRouter);
