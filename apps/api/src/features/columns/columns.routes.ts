import { Router } from "express";
import { requireProjectMember } from "../../middleware/project-membership.middleware";
import { create, list, remove, update } from "./columns.controller";

export const columnsRouter = Router({ mergeParams: true });

columnsRouter.use(requireProjectMember);

columnsRouter.get("/", list);
columnsRouter.post("/", create);
columnsRouter.patch("/:columnId", update);
columnsRouter.delete("/:columnId", remove);
