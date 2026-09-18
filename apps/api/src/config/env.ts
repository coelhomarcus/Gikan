import { z } from "zod";

const envSchema = z.object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
    JWT_EXPIRES_IN: z.string().min(1).default("7d"),
    SPECIAL_REGISTRATION_CODE: z.string().min(1, "SPECIAL_REGISTRATION_CODE is required"),
    ADMIN_USERNAMES: z.string().default(""),
    PORT: z.coerce.number().int().positive().default(3000),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = {
    ...parsed.data,
    adminUsernames: parsed.data.ADMIN_USERNAMES.split(",")
        .map((username) => username.trim().toLowerCase())
        .filter(Boolean),
};
