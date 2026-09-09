import { z } from "zod";

const repositoryUrlSchema = z
    .union([z.string().trim().url("URL inválida"), z.literal("")])
    .nullable()
    .optional()
    .transform((value) => (value === "" ? null : value));

/**
 * Vocabulário de ícones de projeto. São chaves semânticas próprias (não os nomes dos componentes
 * da lib de ícones) justamente pra desacoplar o que fica salvo no banco da biblioteca: trocar o
 * ícone concreto usado pra "rocket" depois não invalida os dados já gravados. O mapa chave →
 * componente vive no frontend (`features/projects/components/project-icon.tsx`).
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
const projectPageContentSchema = z.string().max(100_000, "A página pode ter no máximo 100.000 caracteres");

export const createProjectSchema = z.object({
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().max(2000).optional(),
    repositoryUrl: repositoryUrlSchema,
    icon: iconSchema,
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
    name: z.string().trim().min(2).max(120).optional(),
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
