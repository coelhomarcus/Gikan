import { z } from "zod";

export const createColumnSchema = z.object({
    name: z.string().trim().min(1).max(60),
});
export type CreateColumnInput = z.infer<typeof createColumnSchema>;

export const updateColumnSchema = z
    .object({
        name: z.string().trim().min(1).max(60).optional(),
        position: z.number().finite().optional(),
    })
    .strict();
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;
