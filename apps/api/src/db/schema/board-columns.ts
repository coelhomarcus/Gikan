import { index, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { projects } from "./projects";

export const boardColumns = pgTable(
    "board_columns",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        projectId: uuid("project_id")
            .notNull()
            .references(() => projects.id, { onDelete: "cascade" }),
        name: text("name").notNull(),
        color: text("color"),
        position: real("position").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [index("board_columns_project_id_idx").on(table.projectId)],
);
