import { index, pgEnum, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { boardColumns } from "./board-columns";
import { categories } from "./categories";
import { projects } from "./projects";
import { users } from "./users";

export const cardImportanceEnum = pgEnum("card_importance", ["low", "medium", "high"]);

export const cards = pgTable(
    "cards",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        projectId: uuid("project_id")
            .notNull()
            .references(() => projects.id, { onDelete: "cascade" }),
        columnId: uuid("column_id")
            .notNull()
            .references(() => boardColumns.id, { onDelete: "cascade" }),
        title: text("title").notNull(),
        description: text("description"),
        assigneeId: uuid("assignee_id").references(() => users.id, { onDelete: "set null" }),
        categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
        importance: cardImportanceEnum("importance").notNull().default("medium"),
        createdBy: uuid("created_by")
            .notNull()
            .references(() => users.id),
        position: real("position").notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index("cards_project_id_idx").on(table.projectId),
        index("cards_column_id_idx").on(table.columnId),
        index("cards_assignee_id_idx").on(table.assigneeId),
        index("cards_category_id_idx").on(table.categoryId),
    ],
);
