import { z } from "zod";

export const createCategorySchema = z.object({
    name: z.string().trim().min(1).max(60),
    color: z
        .string()
        .trim()
        .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid hex value, e.g. #7f56d9")
        .optional(),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
