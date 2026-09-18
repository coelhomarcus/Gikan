import { z } from "zod";

const repositoryUrlSchema = z
    .union([z.string().trim().url("Invalid URL"), z.literal("")])
    .nullable()
    .optional()
    .transform((value) => (value === "" ? null : value));

/**
 * Project icon vocabulary. These are semantic keys, not component names from the icon library,
 * so stored data is decoupled from the library: changing the concrete icon used for "rocket"
 * later will not invalidate existing data. The key → component map lives in the frontend
 * (`features/projects/components/project-icon.tsx`).
 */
export const projectIconKeys = [
    "cube",
    "rocket",
    "code",
    "browser",
    "briefcase",
    "book",
    "chart",
    "target",
    "lightbulb",
    "flag",
    "star",
    "heart",
    "globe",
    "server",
    "database",
    "mobile",
    "desktop",
    "cart",
    "zap",
    "package",
    "palette",
    "pen",
    "users",
    "tool",
] as const;
export type ProjectIconKey = (typeof projectIconKeys)[number];

const iconSchema = z.enum(projectIconKeys).nullable().optional();
const projectPageContentSchema = z.string().max(100_000, "The page can contain at most 100,000 characters");
const projectKeySchema = z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{2,8}$/, "Project key must contain 2 to 8 uppercase letters or numbers");
const optionalProjectKeySchema = z.union([projectKeySchema, z.literal("")]).optional().transform((value) => value || undefined);

export const createProjectSchema = z.object({
    name: z.string().trim().min(2).max(120),
    issueKey: optionalProjectKeySchema,
    description: z.string().trim().max(2000).optional(),
    repositoryUrl: repositoryUrlSchema,
    icon: iconSchema,
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
    name: z.string().trim().min(2).max(120).optional(),
    issueKey: optionalProjectKeySchema,
    description: z.string().trim().max(2000).nullable().optional(),
    repositoryUrl: repositoryUrlSchema,
    icon: iconSchema,
});
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const updateProjectPageSchema = z.object({
    pageContent: projectPageContentSchema,
});
export type UpdateProjectPageInput = z.infer<typeof updateProjectPageSchema>;


export const addProjectMemberSchema = z.object({
    username: z.string().trim().toLowerCase().min(1),
});
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
