import type { CreateColumnInput, UpdateColumnInput } from "@todokanban/shared";
import { and, asc, count, desc, eq } from "drizzle-orm";
import { db } from "../../db";
import { boardColumns, cards } from "../../db/schema";
import { HttpError } from "../../lib/http-error";

async function nextColumnPosition(projectId: string): Promise<number> {
    const [last] = await db
        .select({ position: boardColumns.position })
        .from(boardColumns)
        .where(eq(boardColumns.projectId, projectId))
        .orderBy(desc(boardColumns.position))
        .limit(1);

    return (last?.position ?? 0) + 1000;
}

export async function listColumns(projectId: string) {
    return db.query.boardColumns.findMany({
        where: eq(boardColumns.projectId, projectId),
        orderBy: [asc(boardColumns.position)],
    });
}

export async function createColumn(projectId: string, input: CreateColumnInput) {
    const position = await nextColumnPosition(projectId);

    const [column] = await db.insert(boardColumns).values({ projectId, name: input.name, position }).returning();

    return column;
}

export async function updateColumn(projectId: string, columnId: string, input: UpdateColumnInput) {
    const [column] = await db
        .update(boardColumns)
        .set(input)
        .where(and(eq(boardColumns.id, columnId), eq(boardColumns.projectId, projectId)))
        .returning();

    if (!column) {
        throw new HttpError(404, "Coluna não encontrada");
    }

    return column;
}

export async function deleteColumn(projectId: string, columnId: string) {
    const column = await db.query.boardColumns.findFirst({
        where: and(eq(boardColumns.id, columnId), eq(boardColumns.projectId, projectId)),
        columns: { id: true },
    });

    if (!column) {
        throw new HttpError(404, "Coluna não encontrada");
    }

    const [{ value: cardCount }] = await db.select({ value: count() }).from(cards).where(eq(cards.columnId, columnId));

    if (cardCount > 0) {
        throw new HttpError(409, "Mova os cards antes de excluir a coluna");
    }

    await db.delete(boardColumns).where(eq(boardColumns.id, columnId));
}
