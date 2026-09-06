import { createCardSchema, updateCardSchema } from "@todokanban/shared";
import { assertProjectMembership } from "../../middleware/project-membership.middleware";
import { asyncHandler } from "../../middleware/async-handler";
import { createCard, deleteCard, getCardDetail, getCardOrThrow, listCards, updateCard } from "./cards.service";

export const list = asyncHandler<{ projectId: string }>(async (req, res) => {
    const cardList = await listCards(req.params.projectId);
    res.json({ cards: cardList });
});

export const create = asyncHandler<{ projectId: string }>(async (req, res) => {
    const input = createCardSchema.parse(req.body);
    const card = await createCard(req.params.projectId, input, req.user!.sub);
    res.status(201).json({ card });
});

export const getOne = asyncHandler<{ cardId: string }>(async (req, res) => {
    const card = await getCardDetail(req.params.cardId);
    await assertProjectMembership(card.projectId, req.user!.sub, req.user!.isAdmin);
    res.json({ card });
});

export const update = asyncHandler<{ cardId: string }>(async (req, res) => {
    const card = await getCardOrThrow(req.params.cardId);
    await assertProjectMembership(card.projectId, req.user!.sub, req.user!.isAdmin);

    const input = updateCardSchema.parse(req.body);
    const updated = await updateCard(req.params.cardId, card.projectId, input);
    res.json({ card: updated });
});

export const remove = asyncHandler<{ cardId: string }>(async (req, res) => {
    const card = await getCardOrThrow(req.params.cardId);
    await assertProjectMembership(card.projectId, req.user!.sub, req.user!.isAdmin);

    await deleteCard(req.params.cardId);
    res.status(204).send();
});
