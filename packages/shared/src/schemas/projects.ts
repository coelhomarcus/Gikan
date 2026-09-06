import { z } from "zod";

const repositoryUrlSchema = z
    .union([z.string().trim().url("URL inválida"), z.literal("")])
    .nullable()
    .optional()
    .transform((value) => (value === "" ? null : value));

export const createProjectSchema = z.object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(2000).optional(),
    repositoryUrl: repositoryUrlSchema,
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
    name: z.string().trim().min(2).max(120).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    repositoryUrl: repositoryUrlSchema,
});
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const addProjectMemberSchema = z.object({
    username: z.string().trim().toLowerCase().min(1),
});
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
