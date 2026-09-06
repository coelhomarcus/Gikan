import { Router } from "express";
import { requireProjectMember } from "../../middleware/project-membership.middleware";
import { create, list, remove } from "./categories.controller";

export const categoriesRouter = Router({ mergeParams: true });

categoriesRouter.use(requireProjectMember);

categoriesRouter.get("/", list);
categoriesRouter.post("/", create);
categoriesRouter.delete("/:categoryId", remove);
