import { z } from "zod";

/**
 * Cor da coluna em hex (mesmo formato já validado em `categories.ts`). Aceita `""` como
 * equivalente a "sem cor" pelo mesmo motivo de `repositoryUrl`/`avatarUrl`: é o valor natural
 * que um campo limpo manda, e sem o `.transform()` o regex rejeitaria.
 */
const colorSchema = z
    .union([z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Cor deve ser um hex válido, ex: #7a5af8"), z.literal("")])
    .nullable()
    .optional()
    .transform((value) => (value === "" ? null : value));

export const createColumnSchema = z.object({
    name: z.string().trim().min(1).max(60),
    color: colorSchema,
});
export type CreateColumnInput = z.infer<typeof createColumnSchema>;

export const updateColumnSchema = z
    .object({
        name: z.string().trim().min(1).max(60).optional(),
        position: z.number().finite().optional(),
        color: colorSchema,
    })
    .strict();
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;
