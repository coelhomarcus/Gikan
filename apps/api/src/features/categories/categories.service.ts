import type { CreateCategoryInput } from "@todokanban/shared";
import { and, asc, eq } from "drizzle-orm";
import { db } from "../../db";
import { categories } from "../../db/schema";
import { HttpError } from "../../lib/http-error";

export async function listCategories(projectId: string) {
    return db.query.categories.findMany({
        where: eq(categories.projectId, projectId),
        orderBy: [asc(categories.name)],
    });
}

export async function createCategory(projectId: string, input: CreateCategoryInput, creatorId: string) {
    const existing = await db.query.categories.findFirst({
        where: and(eq(categories.projectId, projectId), eq(categories.name, input.name)),
    });

    if (existing) {
        throw new HttpError(409, "Já existe uma categoria com esse nome neste projeto");
    }

    const [category] = await db
        .insert(categories)
        .values({ projectId, name: input.name, color: input.color, createdBy: creatorId })
        .returning();

    return category;
}

interface DeleteCategoryRequester {
    userId: string;
    isAdmin: boolean;
    isProjectOwner: boolean;
}

export async function deleteCategory(projectId: string, categoryId: string, requester: DeleteCategoryRequester) {
    const category = await db.query.categories.findFirst({
        where: and(eq(categories.id, categoryId), eq(categories.projectId, projectId)),
    });

    if (!category) {
        throw new HttpError(404, "Categoria não encontrada");
    }

    const canDelete = requester.isAdmin || requester.isProjectOwner || category.createdBy === requester.userId;
    if (!canDelete) {
        throw new HttpError(403, "Você não tem permissão para excluir esta categoria");
    }

    await db.delete(categories).where(eq(categories.id, categoryId));
}
