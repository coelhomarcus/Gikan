import { z } from "zod";

export const cardImportanceValues = ["low", "medium", "high"] as const;

export const createCardSchema = z.object({
    columnId: z.string().uuid(),
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(5000).nullable().optional(),
    categoryId: z.string().uuid().nullable().optional(),
    assigneeId: z.string().uuid().nullable().optional(),
    importance: z.enum(cardImportanceValues).default("medium"),
});
export type CreateCardInput = z.infer<typeof createCardSchema>;

export const updateCardSchema = z
    .object({
        title: z.string().trim().min(1).max(200).optional(),
        description: z.string().trim().max(5000).nullable().optional(),
        columnId: z.string().uuid().optional(),
        position: z.number().finite().optional(),
        categoryId: z.string().uuid().nullable().optional(),
        assigneeId: z.string().uuid().nullable().optional(),
        importance: z.enum(cardImportanceValues).optional(),
    })
    .strict();
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
