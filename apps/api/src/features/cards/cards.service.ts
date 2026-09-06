import type { CreateCardInput, UpdateCardInput } from "@todokanban/shared";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "../../db";
import { boardColumns, cards, categories } from "../../db/schema";
import { HttpError } from "../../lib/http-error";

async function ensureColumnInProject(columnId: string, projectId: string): Promise<void> {
    const column = await db.query.boardColumns.findFirst({
        where: and(eq(boardColumns.id, columnId), eq(boardColumns.projectId, projectId)),
        columns: { id: true },
    });

    if (!column) {
        throw new HttpError(400, "Coluna não pertence a este projeto");
    }
}

async function ensureCategoryInProject(categoryId: string, projectId: string): Promise<void> {
    const category = await db.query.categories.findFirst({
        where: and(eq(categories.id, categoryId), eq(categories.projectId, projectId)),
        columns: { id: true },
    });

    if (!category) {
        throw new HttpError(400, "Categoria não pertence a este projeto");
    }
}

async function nextPositionInColumn(columnId: string): Promise<number> {
    const [last] = await db
        .select({ position: cards.position })
        .from(cards)
        .where(eq(cards.columnId, columnId))
        .orderBy(desc(cards.position))
        .limit(1);

    return (last?.position ?? 0) + 1000;
}

export async function listCards(projectId: string) {
    return db.query.cards.findMany({
        where: eq(cards.projectId, projectId),
        orderBy: [asc(cards.columnId), asc(cards.position)],
    });
}

export async function createCard(projectId: string, input: CreateCardInput, creatorId: string) {
    await ensureColumnInProject(input.columnId, projectId);
    if (input.categoryId) {
        await ensureCategoryInProject(input.categoryId, projectId);
    }

    const position = await nextPositionInColumn(input.columnId);

    const [card] = await db
        .insert(cards)
        .values({
            projectId,
            columnId: input.columnId,
            title: input.title,
            description: input.description,
            categoryId: input.categoryId,
            difficulty: input.difficulty,
            createdBy: creatorId,
            position,
        })
        .returning();

    return card;
}

export async function getCardOrThrow(cardId: string) {
    const card = await db.query.cards.findFirst({ where: eq(cards.id, cardId) });
    if (!card) {
        throw new HttpError(404, "Card não encontrado");
    }
    return card;
}

export async function updateCard(cardId: string, projectId: string, input: UpdateCardInput) {
    if (input.columnId) {
        await ensureColumnInProject(input.columnId, projectId);
    }
    if (input.categoryId) {
        await ensureCategoryInProject(input.categoryId, projectId);
    }

    const position = input.columnId && input.position === undefined ? await nextPositionInColumn(input.columnId) : input.position;

    const [updated] = await db
        .update(cards)
        .set({ ...input, position, updatedAt: new Date() })
        .where(eq(cards.id, cardId))
        .returning();

    return updated;
}

export async function deleteCard(cardId: string): Promise<void> {
    await db.delete(cards).where(eq(cards.id, cardId));
}
