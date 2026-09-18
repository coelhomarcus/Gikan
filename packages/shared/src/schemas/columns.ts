import { z } from "zod";

/**
 * Column color in hex (the same format validated in `categories.ts`). Accepts `""` as
 * equivalent to "no color" for the same reason as `repositoryUrl`/`avatarUrl`: it is the natural
 * value sent by a cleared field, and without `.transform()` the regex would reject it.
 */
const colorSchema = z
    .union([z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid hex value, e.g. #7a5af8"), z.literal("")])
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
