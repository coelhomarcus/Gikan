/** Drizzle may wrap the PostgreSQL error in `cause`. Only this constraint is a key collision. */
export function isProjectKeyConflict(error: unknown): boolean {
    const seen = new Set<unknown>();
    while (error && typeof error === "object" && !seen.has(error)) {
        seen.add(error);
        const candidate = error as { code?: string; constraint?: string; cause?: unknown };
        if (candidate.code === "23505" && candidate.constraint === "projects_issue_key_unique") return true;
        error = candidate.cause;
    }
    return false;
}
