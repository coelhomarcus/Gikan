import "dotenv/config";
import path from "path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

async function main() {
    await migrate(db, { migrationsFolder: path.resolve(__dirname, "../../drizzle") });
    await pool.end();
    console.log("Migrations applied");
}

main();
