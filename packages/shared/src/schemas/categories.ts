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

export const updateCategorySchema = z
    .object({
        name: z.string().trim().min(1).max(60).optional(),
        color: z
            .string()
            .trim()
            .regex(/^#[0-9a-fA-F]{6}$/, "Color must be a valid hex value, e.g. #7f56d9")
            .nullable()
            .optional(),
    })
    .refine((input) => input.name !== undefined || input.color !== undefined, "Provide a name or color to update");
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
