import type { LoginInput, RegisterInput } from "@todokanban/shared";
import { eq, or } from "drizzle-orm";
import { env } from "../../config/env";
import { db } from "../../db";
import { users } from "../../db/schema";
import { HttpError } from "../../lib/http-error";
import { signToken } from "../../lib/jwt";
import { hashPassword, verifyPassword } from "../../lib/password";

function toPublicUser(user: typeof users.$inferSelect) {
    const { passwordHash: _passwordHash, ...publicUser } = user;
    return publicUser;
}

export async function registerUser(input: RegisterInput) {
    if (input.specialCode !== env.SPECIAL_REGISTRATION_CODE) {
        throw new HttpError(403, "Código especial inválido");
    }

    const existing = await db.query.users.findFirst({
        where: or(eq(users.username, input.username), eq(users.email, input.email)),
    });

    if (existing) {
        const conflictField = existing.username === input.username ? "usuário" : "email";
        throw new HttpError(409, `Este ${conflictField} já está em uso`);
    }

    const passwordHash = await hashPassword(input.password);
    const isAdmin = env.adminUsernames.includes(input.username);

    const [user] = await db
        .insert(users)
        .values({
            name: input.name,
            username: input.username,
            email: input.email,
            passwordHash,
            isAdmin,
        })
        .returning();

    const token = signToken({ sub: user.id, username: user.username, isAdmin: user.isAdmin });
    return { user: toPublicUser(user), token };
}

export async function loginUser(input: LoginInput) {
    const identifier = input.identifier.trim().toLowerCase();

    const user = await db.query.users.findFirst({
        where: or(eq(users.username, identifier), eq(users.email, identifier)),
    });

    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
        throw new HttpError(401, "Usuário ou senha incorretos");
    }

    const token = signToken({ sub: user.id, username: user.username, isAdmin: user.isAdmin });
    return { user: toPublicUser(user), token };
}

export async function getUserById(id: string) {
    const user = await db.query.users.findFirst({ where: eq(users.id, id) });

    if (!user) {
        throw new HttpError(401, "Usuário não encontrado");
    }

    return toPublicUser(user);
}
