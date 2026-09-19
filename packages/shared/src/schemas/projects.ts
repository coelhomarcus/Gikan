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
    "activity",
    "archive",
    "atom",
    "award",
    "blocks",
    "bot",
    "building",
    "calendar",
    "cloud",
    "compass",
    "cpu",
    "diamond",
    "fingerprint",
    "flask",
    "folder",
    "gamepad",
    "gauge",
    "gift",
    "headphones",
    "house",
    "layers",
    "leaf",
    "lock",
    "map",
    "message",
    "music",
    "plane",
    "puzzle",
    "shield",
    "sparkles",
    "store",
    "tag",
    "terminal",
    "telescope",
    "thumbs-up",
    "ticket",
    "video",
    "wallet",
    "workflow",
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

/** Generates the readable default key used when a project is created. */
export function suggestProjectKey(name: string): string {
    const normalized = name
        .normalize("NFKD")
        .replace(/\p{Diacritic}/gu, "")
        .toUpperCase();
    const words = normalized.split(/[^A-Z0-9]+/).filter(Boolean);
    const compact = normalized.replace(/[^A-Z0-9]/g, "");
    const initials = words.length > 1 ? words.map((word) => word[0]).join("") : compact;
    const candidate = initials.slice(0, 8);

    return candidate.length >= 2 ? candidate : "PRJ";
}

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
