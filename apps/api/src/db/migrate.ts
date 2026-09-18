import "dotenv/config";
import path from "path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function main() {
    // Resolved from cwd (not __dirname) so it works the same in development (tsx, cwd=apps/api)
    // and in the production bundle (esbuild flattens src/db/migrate.ts into dist/migrate.js,
    // which would change __dirname's relative depth); the Dockerfile sets WORKDIR=/app/apps/api.
    await migrate(db, { migrationsFolder: path.resolve(process.cwd(), "drizzle") });
    await pool.end();
    console.log("Migrations applied");
}

main();
