import { jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { projects } from "./projects";
import type { TiptapDocument } from "./issues";

export const projectDocuments = pgTable("project_documents", {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
        .notNull()
        .unique()
        .references(() => projects.id, { onDelete: "cascade" }),
    contentJson: jsonb("content_json").$type<TiptapDocument>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
