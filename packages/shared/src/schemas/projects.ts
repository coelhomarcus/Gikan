import { z } from "zod";

export const createProjectSchema = z.object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(2000).optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
    name: z.string().trim().min(2).max(120).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
});
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const addProjectMemberSchema = z.object({
    username: z.string().trim().toLowerCase().min(1),
});
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
