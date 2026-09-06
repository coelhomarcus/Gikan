import type { UpdateProfileInput } from "@todokanban/shared";
import { eq } from "drizzle-orm";
import { db } from "../../db";
import { users } from "../../db/schema";
import { HttpError } from "../../lib/http-error";
import { toPublicUser } from "../auth/auth.service";

export async function updateProfile(userId: string, input: UpdateProfileInput) {
    const [user] = await db
        .update(users)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();

    if (!user) {
        throw new HttpError(404, "Usuário não encontrado");
    }

    return toPublicUser(user);
}
