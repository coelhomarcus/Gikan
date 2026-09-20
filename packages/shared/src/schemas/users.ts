import { z } from "zod";
import { localeSchema } from "../locales";

export const updateProfileSchema = z
    .object({
        name: z.string().trim().min(2).max(80).optional(),
        // Accepts "" (a cleared UI field) as equivalent to "remove the photo". Without this, a user
        // without an avatarUrl who only wants to edit their name would hit .url() on an empty field.
        avatarUrl: z
            .union([z.string().trim().url("Invalid URL"), z.literal("")])
            .nullable()
            .optional()
            .transform((value) => (value === "" ? null : value)),
        locale: localeSchema.optional(),
    })
    .strict();
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const updateLocaleSchema = z.object({ locale: localeSchema }).strict();
export type UpdateLocaleInput = z.infer<typeof updateLocaleSchema>;
