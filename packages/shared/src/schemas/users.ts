import { z } from "zod";

export const updateProfileSchema = z
    .object({
        name: z.string().trim().min(2).max(80).optional(),
        // Aceita "" (campo limpo na UI) como equivalente a "remover a foto" — sem isso, um usuário
        // sem avatarUrl que só quer editar o nome esbarraria no .url() ao submeter o campo vazio.
        avatarUrl: z
            .union([z.string().trim().url("URL inválida"), z.literal("")])
            .nullable()
            .optional()
            .transform((value) => (value === "" ? null : value)),
    })
    .strict();
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
