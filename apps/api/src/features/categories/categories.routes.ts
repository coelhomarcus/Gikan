import { Router } from "express";
import { requireProjectMember } from "../../middleware/project-membership.middleware";
import { create, list, remove, update } from "./categories.controller";

export const categoriesRouter = Router({ mergeParams: true });

categoriesRouter.use(requireProjectMember);

categoriesRouter.get("/", list);
categoriesRouter.post("/", create);
categoriesRouter.patch("/:categoryId", update);
categoriesRouter.delete("/:categoryId", remove);
