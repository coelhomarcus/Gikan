import { z } from "zod";

export const registerSchema = z.object({
    name: z.string().trim().min(2).max(80),
    username: z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^[a-z0-9_]{3,32}$/, "Usuário deve ter 3-32 caracteres: letras minúsculas, números e _"),
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8).max(72),
    specialCode: z.string().min(1),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
    identifier: z.string().trim().min(1),
    password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;
