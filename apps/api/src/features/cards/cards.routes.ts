import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireProjectMember } from "../../middleware/project-membership.middleware";
import { create, getOne, list, remove, update } from "./cards.controller";

/** Mounted at /api/projects/:projectId/cards — listing/creation require project membership from the URL. */
export const projectCardsRouter = Router({ mergeParams: true });
projectCardsRouter.use(requireProjectMember);
projectCardsRouter.get("/", list);
projectCardsRouter.post("/", create);

/** Mounted at /api/cards — view/move/edit/delete a specific card; the project is discovered from the card. */
export const cardsRouter = Router();
cardsRouter.use(requireAuth);
cardsRouter.get("/:cardId", getOne);
cardsRouter.patch("/:cardId", update);
cardsRouter.delete("/:cardId", remove);
