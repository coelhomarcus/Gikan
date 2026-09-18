import "dotenv/config";
import path from "path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { sql } from "drizzle-orm";
import { markdownToTiptap } from "@gikan/shared";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function main() {
    // Resolved from cwd (not __dirname) so it works the same in development (tsx, cwd=apps/api)
    // and in the production bundle (esbuild flattens src/db/migrate.ts into dist/migrate.js,
    // which would change __dirname's relative depth); the Dockerfile sets WORKDIR=/app/apps/api.
    await migrate(db, { migrationsFolder: path.resolve(process.cwd(), "drizzle") });
    await migrateLegacyMarkdown();
    await pool.end();
    console.log("Migrations applied");
}

async function migrateLegacyMarkdown() {
    const legacyIssues = await db.execute(sql`SELECT id, description FROM issues WHERE description IS NOT NULL AND description <> '' AND description_json->'content'->0->>'text' = description`);
    for (const row of legacyIssues.rows as Array<{ id: string; description: string }>) {
        await db.execute(sql`UPDATE issues SET description_json = ${JSON.stringify(markdownToTiptap(row.description))}::jsonb WHERE id = ${row.id}`);
    }

    const legacyDocuments = await db.execute(sql`SELECT id, page_content FROM projects WHERE page_content IS NOT NULL AND page_content <> ''`);
    for (const row of legacyDocuments.rows as Array<{ id: string; page_content: string }>) {
        const existing = await db.execute(sql`SELECT content_json FROM project_documents WHERE project_id = ${row.id}`);
        const current = existing.rows[0] as { content_json?: unknown } | undefined;
        const currentText = typeof current?.content_json === "object" && current.content_json !== null ? JSON.stringify(current.content_json) : "";
        const legacyParagraph = JSON.stringify({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: row.page_content }] }] });
        if (!current || currentText === legacyParagraph) {
            await db.execute(sql`UPDATE project_documents SET content_json = ${JSON.stringify(markdownToTiptap(row.page_content))}::jsonb WHERE project_id = ${row.id}`);
        }
    }
}

main();
