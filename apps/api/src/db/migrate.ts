import "dotenv/config";
import path from "path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function main() {
    // Resolvido a partir do cwd (não de __dirname) pra funcionar igual em dev (tsx, cwd=apps/api)
    // e no bundle de produção (esbuild achata src/db/migrate.ts em dist/migrate.js, o que mudaria
    // a profundidade relativa de __dirname); o Dockerfile seta WORKDIR=/app/apps/api.
    await migrate(db, { migrationsFolder: path.resolve(process.cwd(), "drizzle") });
    await pool.end();
    console.log("Migrations applied");
}

main();
