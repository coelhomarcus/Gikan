import { index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { projects } from "./projects";

export const cycleStatusEnum = pgEnum("cycle_status", ["planned", "active", "completed"]);

export const projectCycles = pgTable(
    "project_cycles",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        projectId: uuid("project_id")
            .notNull()
            .references(() => projects.id, { onDelete: "cascade" }),
        number: integer("number").notNull(),
        name: text("name").notNull(),
        status: cycleStatusEnum("status").notNull().default("planned"),
        startsAt: timestamp("starts_at", { withTimezone: true }),
        endsAt: timestamp("ends_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [index("project_cycles_project_id_idx").on(table.projectId)],
);
