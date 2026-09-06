import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireProjectMember } from "../../middleware/project-membership.middleware";
import { create, getOne, list, remove, update } from "./cards.controller";

/** Montado em /api/projects/:projectId/cards — listar/criar exigem membership do projeto na URL. */
export const projectCardsRouter = Router({ mergeParams: true });
projectCardsRouter.use(requireProjectMember);
projectCardsRouter.get("/", list);
projectCardsRouter.post("/", create);

/** Montado em /api/cards — ver detalhe/mover/editar/excluir um card específico; o projeto é descoberto a partir do card. */
export const cardsRouter = Router();
cardsRouter.use(requireAuth);
cardsRouter.get("/:cardId", getOne);
cardsRouter.patch("/:cardId", update);
cardsRouter.delete("/:cardId", remove);
